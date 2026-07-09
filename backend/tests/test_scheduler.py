from datetime import datetime, timedelta
from app.scheduler_engine import detect_conflicts, solve_rescheduling, check_overlap
from app.models import Tournament, Team, Venue, Match

class MockTeam:
    def __init__(self, id, name):
        self.id = id
        self.name = name

class MockVenue:
    def __init__(self, id, name, capacity=10000):
        self.id = id
        self.name = name
        self.capacity = capacity

class MockTournament:
    def __init__(self):
        self.id = 1
        self.operating_hours_start = "08:00"
        self.operating_hours_end = "22:00"
        self.min_rest_time = 120
        self.match_duration = 40

class MockMatch:
    def __init__(self, id, team_a_id, team_b_id, venue_id, start_time, end_time, round=1):
        self.id = id
        self.team_a_id = team_a_id
        self.team_b_id = team_b_id
        self.venue_id = venue_id
        self.start_time = start_time
        self.end_time = end_time
        self.original_start_time = start_time
        self.original_end_time = end_time
        self.status = "Scheduled"
        self.score_a = 0
        self.score_b = 0
        self.delay_minutes = 0
        self.delay_reason = None
        self.attendance = 5000
        self.round = round
        self.team_a = MockTeam(team_a_id, f"Team {team_a_id}")
        self.team_b = MockTeam(team_b_id, f"Team {team_b_id}")
        self.venue = MockVenue(venue_id, f"Venue {venue_id}")

def test_overlap_detection():
    start_a = datetime(2026, 7, 10, 9, 0)
    end_a = datetime(2026, 7, 10, 9, 40)
    
    # Overlapping
    start_b = datetime(2026, 7, 10, 9, 30)
    end_b = datetime(2026, 7, 10, 10, 10)
    
    assert check_overlap(start_a, end_a, start_b, end_b) is True
    
    # Non-overlapping (exact touch is fine or gap is fine)
    start_c = datetime(2026, 7, 10, 9, 40)
    end_c = datetime(2026, 7, 10, 10, 20)
    assert check_overlap(start_a, end_a, start_c, end_c) is False

def test_conflict_detection():
    t = MockTournament()
    start_1 = datetime(2026, 7, 10, 9, 0)
    end_1 = datetime(2026, 7, 10, 9, 40)
    
    # Case 1: Venue double booking
    m1 = MockMatch("M01", 1, 2, 1, start_1, end_1)
    m2 = MockMatch("M02", 3, 4, 1, start_1, end_1) # Same venue, same time
    
    quality, conflicts = detect_conflicts([m1, m2], t)
    assert any(c.conflict_type == "VENUE_DOUBLE_BOOKING" for c in conflicts)
    assert quality < 100

    # Case 2: Team double booking
    m3 = MockMatch("M03", 1, 3, 2, start_1, end_1) # Team 1 plays in m1 and m3
    quality, conflicts = detect_conflicts([m1, m3], t)
    assert any(c.conflict_type == "TEAM_DOUBLE_BOOKING" for c in conflicts)

    # Case 3: Operating hours violation
    m4 = MockMatch("M04", 1, 2, 1, datetime(2026, 7, 10, 7, 0), datetime(2026, 7, 10, 7, 40))
    quality, conflicts = detect_conflicts([m4], t)
    assert any(c.conflict_type == "OPERATING_HOURS_VIOLATION" for c in conflicts)

def test_rescheduling_engine():
    t = MockTournament()
    
    # Set up 3 consecutive matches on same venue
    # M1: 09:00 - 09:40, Venue 1
    # M2: 09:50 - 10:30, Venue 1
    # M3: 10:40 - 11:20, Venue 1
    
    start_1 = datetime(2026, 7, 10, 9, 0)
    end_1 = datetime(2026, 7, 10, 9, 40)
    
    start_2 = datetime(2026, 7, 10, 9, 50)
    end_2 = datetime(2026, 7, 10, 10, 30)
    
    start_3 = datetime(2026, 7, 10, 10, 40)
    end_3 = datetime(2026, 7, 10, 11, 20)
    
    m1 = MockMatch("M01", 1, 2, 1, start_1, end_1)
    m2 = MockMatch("M02", 3, 4, 1, start_2, end_2)
    m3 = MockMatch("M03", 5, 6, 1, start_3, end_3)
    
    # Delay M1 by 30 minutes
    # M1 starts at 09:30, ends at 10:10.
    # This overlaps with M2 (09:50 - 10:30).
    # Rescheduling should shift M2 to start after M1 ends + 10 mins buffer = 10:20.
    # New M2 ends at 11:00.
    # This now overlaps with M3 (10:40 - 11:20).
    # M3 should shift to start after M2 ends + 10 mins buffer = 11:10.
    
    shifted = solve_rescheduling([m1, m2, m3], t, "M01", 30)
    
    shifted_dict = {m["id"]: m for m in shifted}
    
    assert shifted_dict["M01"]["start_time"] == datetime(2026, 7, 10, 9, 30)
    assert shifted_dict["M02"]["start_time"] >= datetime(2026, 7, 10, 10, 20)
    assert shifted_dict["M03"]["start_time"] >= datetime(2026, 7, 10, 11, 10)
