from datetime import datetime, timedelta, time
from typing import List, Tuple, Dict, Any
from .schemas import ConflictDetailResponse
from .models import Match, Tournament, Team, Venue

def get_match_datetime_range(m) -> Tuple[datetime, datetime]:
    # Returns (start_time, end_time) as datetime objects, handling both dicts and DB models
    if isinstance(m, dict):
        start = m.get("start_time")
        end = m.get("end_time")
    else:
        start = m.start_time
        end = m.end_time
    
    if isinstance(start, str):
        start = datetime.fromisoformat(start)
    if isinstance(end, str):
        end = datetime.fromisoformat(end)
    return start, end

def parse_time_str(time_str: str) -> time:
    parts = time_str.split(":")
    return time(int(parts[0]), int(parts[1]))

def check_overlap(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return start_a < end_b and start_b < end_a

def get_entity_name(entity: Any, default: str) -> str:
    if not entity:
        return default
    if isinstance(entity, dict):
        return entity.get("name") or default
    return getattr(entity, "name", default)

def detect_conflicts(matches_list: List[Any], tournament: Any) -> Tuple[int, List[ConflictDetailResponse]]:
    conflicts = []
    hard_violations = 0
    rest_violations = 0
    
    # We may have matches as DB models or dicts from api schemas, normalize them
    # For safety, let's represent them in a simple dict list
    normalized_matches = []
    for m in matches_list:
        start, end = get_match_datetime_range(m)
        if isinstance(m, dict):
            m_id = m.get("id")
            team_a_id = m.get("team_a_id")
            team_b_id = m.get("team_b_id")
            venue_id = m.get("venue_id")
            team_a_name = get_entity_name(m.get("team_a"), f"Team {team_a_id}")
            team_b_name = get_entity_name(m.get("team_b"), f"Team {team_b_id}")
            venue_name = get_entity_name(m.get("venue"), f"Venue {venue_id}")
            round_num = m.get("round", 1)
        else:
            m_id = m.id
            team_a_id = m.team_a_id
            team_b_id = m.team_b_id
            venue_id = m.venue_id
            team_a_name = m.team_a.name if m.team_a else f"Team {team_a_id}"
            team_b_name = m.team_b.name if m.team_b else f"Team {team_b_id}"
            venue_name = m.venue.name if m.venue else f"Venue {venue_id}"
            round_num = m.round

        normalized_matches.append({
            "id": m_id,
            "team_a_id": team_a_id,
            "team_b_id": team_b_id,
            "venue_id": venue_id,
            "team_a_name": team_a_name,
            "team_b_name": team_b_name,
            "venue_name": venue_name,
            "start": start,
            "end": end,
            "round": round_num
        })

    # 1. Venue double-booking (Hard Constraint)
    # Check for overlapping matches in the same venue
    for i in range(len(normalized_matches)):
        for j in range(i + 1, len(normalized_matches)):
            m1 = normalized_matches[i]
            m2 = normalized_matches[j]
            if m1["venue_id"] == m2["venue_id"]:
                if check_overlap(m1["start"], m1["end"], m2["start"], m2["end"]):
                    hard_violations += 1
                    conflicts.append(ConflictDetailResponse(
                        conflict_type="VENUE_DOUBLE_BOOKING",
                        affected_teams=[m1["team_a_name"], m1["team_b_name"], m2["team_a_name"], m2["team_b_name"]],
                        affected_venue=m1["venue_name"],
                        operational_consequence=f"Matches {m1['id']} and {m2['id']} scheduled at the same venue simultaneously ({m1['start'].strftime('%H:%M')} vs {m2['start'].strftime('%H:%M')}).",
                        recommended_resolution="Reschedule one match to a later time slot or allocate to a different venue."
                    ))

    # 2. Team double-booking (Hard Constraint)
    for i in range(len(normalized_matches)):
        for j in range(i + 1, len(normalized_matches)):
            m1 = normalized_matches[i]
            m2 = normalized_matches[j]
            shared_teams = []
            if m1["team_a_id"] in (m2["team_a_id"], m2["team_b_id"]):
                shared_teams.append(m1["team_a_name"])
            if m1["team_b_id"] in (m2["team_a_id"], m2["team_b_id"]):
                shared_teams.append(m1["team_b_name"])
            
            if shared_teams:
                if check_overlap(m1["start"], m1["end"], m2["start"], m2["end"]):
                    hard_violations += 1
                    conflicts.append(ConflictDetailResponse(
                        conflict_type="TEAM_DOUBLE_BOOKING",
                        affected_teams=shared_teams,
                        affected_venue=None,
                        operational_consequence=f"Team(s) {', '.join(shared_teams)} scheduled to play two overlapping matches ({m1['id']} and {m2['id']}).",
                        recommended_resolution="Shift one match slot to preserve team recovery and avoid simultaneous play."
                    ))

    # 3. Operating hours violation (Hard Constraint)
    op_start = parse_time_str(tournament.operating_hours_start) if isinstance(tournament.operating_hours_start, str) else tournament.operating_hours_start
    op_end = parse_time_str(tournament.operating_hours_end) if isinstance(tournament.operating_hours_end, str) else tournament.operating_hours_end

    for m in normalized_matches:
        match_start_time = m["start"].time()
        match_end_time = m["end"].time()
        
        # Check if start is before operating hours or end is after operating hours
        if match_start_time < op_start or match_end_time > op_end:
            hard_violations += 1
            conflicts.append(ConflictDetailResponse(
                conflict_type="OPERATING_HOURS_VIOLATION",
                affected_teams=[m["team_a_name"], m["team_b_name"]],
                affected_venue=m["venue_name"],
                operational_consequence=f"Match {m['id']} is scheduled outside stadium operating hours ({m['start'].strftime('%H:%M')} - {m['end'].strftime('%H:%M')}).",
                recommended_resolution="Shift match start time within the operational window (08:00 - 22:00)."
            ))

    # 4. Team rest-time violation (Soft Constraint)
    # Check minimum rest time between matches for any team
    min_rest = timedelta(minutes=tournament.min_rest_time)
    for i in range(len(normalized_matches)):
        for j in range(i + 1, len(normalized_matches)):
            m1 = normalized_matches[i]
            m2 = normalized_matches[j]
            
            # Find if there is a team in common
            common_team = None
            if m1["team_a_id"] in (m2["team_a_id"], m2["team_b_id"]):
                common_team = m1["team_a_name"]
            elif m1["team_b_id"] in (m2["team_a_id"], m2["team_b_id"]):
                common_team = m1["team_b_name"]
                
            if common_team:
                # Determine chronological order
                first_match, second_match = (m1, m2) if m1["start"] < m2["start"] else (m2, m1)
                gap = second_match["start"] - first_match["end"]
                
                # Check rest violation (only if they are on same day - if different day, check actual time)
                # If they play consecutively and the gap is less than rest time
                if gap < min_rest and gap >= timedelta(0):
                    rest_violations += 1
                    conflicts.append(ConflictDetailResponse(
                        conflict_type="REST_TIME_VIOLATION",
                        affected_teams=[common_team],
                        affected_venue=second_match["venue_name"],
                        operational_consequence=f"{common_team} has only {int(gap.total_seconds() / 60)} mins of rest between Match {first_match['id']} and Match {second_match['id']}.",
                        recommended_resolution="Increase spacing between matches to meet the 120-minute minimum rest requirement."
                    ))

    # Calculate Quality Score
    # We penalize venue imbalance as well
    venue_counts = {}
    for m in normalized_matches:
        venue_counts[m["venue_id"]] = venue_counts.get(m["venue_id"], 0) + 1
    
    venue_imbalance_penalty = 0
    if venue_counts:
        max_matches = max(venue_counts.values())
        min_matches = min(venue_counts.values())
        if max_matches - min_matches > 2:
            venue_imbalance_penalty = (max_matches - min_matches) * 2

    quality_score = 100 - (hard_violations * 25) - (rest_violations * 10) - venue_imbalance_penalty
    quality_score = max(0, min(100, quality_score))

    return int(quality_score), conflicts

def generate_round_robin_schedule(tournament: Tournament, teams: List[Team], venues: List[Venue]) -> List[Dict[str, Any]]:
    # Deterministic generation of 16 matches for 16 teams across 4 venues
    # Let's schedule 4 rounds, each round containing 4 parallel matches
    # Session times per day: 09:00, 11:30, 14:00, 16:30
    # Day 1: Rounds 1 & 2
    # Day 2: Rounds 3 & 4
    
    start_date = tournament.start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 4 time slots per day
    slots = [
        (9, 0),   # 09:00
        (11, 30), # 11:30 (leaves 2.5 hours gap. Match is 40 mins, so rest is plenty)
        (14, 0),  # 14:00
        (16, 30)  # 16:30
    ]

    matches_to_create = []
    
    # Simple pairings:
    # Team pairings for Round 1: T1-T2, T3-T4, T5-T6, T7-T8 (Session 1, Day 1)
    # Team pairings for Round 2: T9-T10, T11-T12, T13-T14, T15-T16 (Session 2, Day 1)
    # Team pairings for Round 3: T1-T3, T2-T4, T5-T7, T6-T8 (Session 3, Day 1)
    # Team pairings for Round 4: T9-T11, T10-T12, T13-T15, T14-T16 (Session 4, Day 1)
    # This gives 16 matches, all teams play twice, 4 venues fully utilized.
    
    pairings = [
        # Round 1
        [(0, 1), (2, 3), (4, 5), (6, 7)],
        # Round 2
        [(8, 9), (10, 11), (12, 13), (14, 15)],
        # Round 3
        [(0, 2), (1, 3), (4, 6), (5, 7)],
        # Round 4
        [(8, 10), (9, 11), (12, 14), (13, 15)]
    ]

    match_index = 1
    
    for round_idx, round_pairs in enumerate(pairings):
        # Determine day and slot
        # round 0 -> day 0, slot 0
        # round 1 -> day 0, slot 1
        # round 2 -> day 0, slot 2
        # round 3 -> day 0, slot 3
        day_offset = 0
        slot_hours, slot_minutes = slots[round_idx % 4]
        
        match_date = start_date + timedelta(days=day_offset)
        match_start = match_date.replace(hour=slot_hours, minute=slot_minutes)
        match_end = match_start + timedelta(minutes=tournament.match_duration)
        
        for match_in_round_idx, (t_a_idx, t_b_idx) in enumerate(round_pairs):
            # Assign venue
            venue = venues[match_in_round_idx % len(venues)]
            team_a = teams[t_a_idx]
            team_b = teams[t_b_idx]
            
            match_id = f"M{match_index:02d}"
            
            matches_to_create.append({
                "id": match_id,
                "tournament_id": tournament.id,
                "team_a_id": team_a.id,
                "team_b_id": team_b.id,
                "venue_id": venue.id,
                "round": round_idx + 1,
                "original_start_time": match_start,
                "original_end_time": match_end,
                "start_time": match_start,
                "end_time": match_end,
                "status": "Scheduled",
                "score_a": 0,
                "score_b": 0,
                "delay_minutes": 0,
                "delay_reason": None,
                "attendance": int(venue.capacity * 0.75) # 75% average attendance
            })
            match_index += 1

    return matches_to_create

def solve_rescheduling(matches_list: List[Any], tournament: Any, delayed_match_id: str, delay_minutes: int) -> List[Dict[str, Any]]:
    # Propagates delay and shifts downstream matches to avoid conflicts
    # Let's sort all matches chronologically by original/current start time
    
    # 1. Gather matches and parse them into local objects
    matches_dict = {}
    for m in matches_list:
        start, end = get_match_datetime_range(m)
        orig_start = m.original_start_time if not isinstance(m, dict) else m.get("original_start_time")
        orig_end = m.original_end_time if not isinstance(m, dict) else m.get("original_end_time")
        if isinstance(orig_start, str): orig_start = datetime.fromisoformat(orig_start)
        if isinstance(orig_end, str): orig_end = datetime.fromisoformat(orig_end)
        
        m_id = m.id if not isinstance(m, dict) else m.get("id")
        
        matches_dict[m_id] = {
            "id": m_id,
            "tournament_id": tournament.id,
            "team_a_id": m.team_a_id if not isinstance(m, dict) else m.get("team_a_id"),
            "team_b_id": m.team_b_id if not isinstance(m, dict) else m.get("team_b_id"),
            "venue_id": m.venue_id if not isinstance(m, dict) else m.get("venue_id"),
            "round": m.round if not isinstance(m, dict) else m.get("round"),
            "original_start_time": orig_start,
            "original_end_time": orig_end,
            "start_time": start,
            "end_time": end,
            "status": m.status if not isinstance(m, dict) else m.get("status"),
            "score_a": m.score_a if not isinstance(m, dict) else m.get("score_a", 0),
            "score_b": m.score_b if not isinstance(m, dict) else m.get("score_b", 0),
            "delay_minutes": m.delay_minutes if not isinstance(m, dict) else m.get("delay_minutes", 0),
            "delay_reason": m.delay_reason if not isinstance(m, dict) else m.get("delay_reason"),
            "attendance": m.attendance if not isinstance(m, dict) else m.get("attendance", 0),
            # Keep relations if available
            "team_a": m.team_a if not isinstance(m, dict) else m.get("team_a"),
            "team_b": m.team_b if not isinstance(m, dict) else m.get("team_b"),
            "venue": m.venue if not isinstance(m, dict) else m.get("venue"),
        }

    # 2. Apply delay to the target match
    target = matches_dict[delayed_match_id]
    target["delay_minutes"] = delay_minutes
    target["start_time"] = target["start_time"] + timedelta(minutes=delay_minutes)
    target["end_time"] = target["end_time"] + timedelta(minutes=delay_minutes)
    target["status"] = "Delayed"

    # Get match duration
    duration = timedelta(minutes=tournament.match_duration)
    min_rest = timedelta(minutes=tournament.min_rest_time)
    
    op_start_t = parse_time_str(tournament.operating_hours_start) if isinstance(tournament.operating_hours_start, str) else tournament.operating_hours_start
    op_end_t = parse_time_str(tournament.operating_hours_end) if isinstance(tournament.operating_hours_end, str) else tournament.operating_hours_end

    # 3. Resolve conflicts iteratively
    # We loop multiple times to ensure all downstream shifts propagate
    max_iterations = 10
    any_shifted = True
    iteration = 0
    
    while any_shifted and iteration < max_iterations:
        any_shifted = False
        iteration += 1
        
        # Sort matches by start time to process chronologically
        sorted_keys = sorted(matches_dict.keys(), key=lambda k: matches_dict[k]["start_time"])
        
        for k in sorted_keys:
            m = matches_dict[k]
            if m["status"] == "Completed":
                continue
                
            # We want to check if this match conflicts with any other match
            # If so, and this match starts LATER, we shift it to resolve the conflict
            earliest_start = m["start_time"]
            
            for other_id in sorted_keys:
                if other_id == m["id"]:
                    continue
                other = matches_dict[other_id]
                
                # Check venue collision: same venue, overlapping time
                if m["venue_id"] == other["venue_id"]:
                    # If they overlap, the one that starts later must shift
                    if check_overlap(m["start_time"], m["end_time"], other["start_time"], other["end_time"]):
                        if m["start_time"] >= other["start_time"]:
                            # Shift m to start after other ends
                            new_start = other["end_time"] + timedelta(minutes=10) # 10 mins buffer between matches in same venue
                            if new_start > earliest_start:
                                earliest_start = new_start
                                
                # Check team collision: same team, overlapping time
                m_teams = {m["team_a_id"], m["team_b_id"]}
                other_teams = {other["team_a_id"], other["team_b_id"]}
                if m_teams.intersection(other_teams):
                    # Hard collision (overlapping) or Soft collision (insufficient rest)
                    # Let's check rest time: if other plays before m, check gap
                    if other["start_time"] < m["start_time"]:
                        gap_start = other["end_time"] + min_rest
                        if gap_start > earliest_start:
                            earliest_start = gap_start

            # Check operating hours violation for the new earliest_start
            # If it falls outside operating hours, move it to the next day's operating hours start
            start_time_of_day = earliest_start.time()
            end_time_of_day = (earliest_start + duration).time()
            
            if start_time_of_day < op_start_t:
                earliest_start = earliest_start.replace(hour=op_start_t.hour, minute=op_start_t.minute)
            elif end_time_of_day > op_end_t:
                # Move to next day at operating hours start
                earliest_start = earliest_start + timedelta(days=1)
                earliest_start = earliest_start.replace(hour=op_start_t.hour, minute=op_start_t.minute)

            # If we shifted this match, update it and mark any_shifted = True
            if earliest_start > m["start_time"]:
                m["start_time"] = earliest_start
                m["end_time"] = earliest_start + duration
                m["delay_minutes"] = int((earliest_start - m["original_start_time"]).total_seconds() / 60)
                if m["id"] != delayed_match_id and m["status"] == "Scheduled":
                    m["status"] = "Delayed" # Auto marks shifted matches as Delayed or keeps them
                any_shifted = True

    return list(matches_dict.values())
