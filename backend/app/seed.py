from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, Base
from .models import User, Tournament, Team, Venue, Match, CrowdZone, ResponseTeam, Incident, OperationalEvent, AuditLog, Notification, Alert
from .scheduler_engine import generate_round_robin_schedule
from .crowd_simulation import calculate_risk_score, get_risk_status

def seed_db(db: Session):
    # Reset all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Users
    users = [
        User(username="organizer", role="Organizer"),
        User(username="operations", role="Operations Manager"),
        User(username="security", role="Security Officer"),
        User(username="medical", role="Medical Coordinator")
    ]
    db.add_all(users)

    # 2. Teams (16 Teams)
    team_data = [
        ("Apex FC", "APX"),
        ("Blizzard SC", "BLZ"),
        ("Calypso United", "CLP"),
        ("Dynamo FC", "DYN"),
        ("Eclipse Sporting", "ECL"),
        ("Fusion Athletics", "FUS"),
        ("Genesis SC", "GEN"),
        ("Horizon United", "HRZ"),
        ("Infinite FC", "INF"),
        ("Jupiter FC", "JUP"),
        ("Keystone Sporting", "KEY"),
        ("Legacy United", "LEG"),
        ("Matrix SC", "MTX"),
        ("Nova FC", "NOV"),
        ("Omega Sporting", "OMG"),
        ("Pinnacle FC", "PIN")
    ]
    teams = [Team(name=name, short_name=short) for name, short in team_data]
    db.add_all(teams)
    db.commit() # Commit to get IDs

    # 3. Venues (4 Venues)
    venue_data = [
        ("Grand Arena", 45000),
        ("Prestige Stadium", 35000),
        ("Summit Field", 25000),
        ("Apex Bowl", 20000)
    ]
    venues = [Venue(name=name, capacity=cap) for name, cap in venue_data]
    db.add_all(venues)
    db.commit()

    # 4. Crowd Zones (9 Zones)
    zone_data = [
        ("north_stand", "North Stand", 15000, 4500, 10.0, 5.0, 10, 0.0),
        ("south_stand", "South Stand", 12000, 3600, 8.0, 4.0, 5, 0.0),
        ("east_stand", "East Stand", 10000, 3000, 12.0, 6.0, 8, 0.0),
        ("west_stand", "West Stand", 11000, 3300, 15.0, 8.0, 12, 0.0),
        ("food_court", "Food Court", 3000, 1200, 25.0, 20.0, 25, 0.1),
        ("gate_a", "Entry Gate A", 500, 100, 30.0, 0.0, 20, 0.0),
        ("gate_b", "Entry Gate B", 500, 120, 25.0, 0.0, 15, 0.0),
        ("gate_c", "Entry Gate C", 500, 80, 20.0, 0.0, 10, 0.0),
        ("parking", "Parking Area", 4000, 2200, 15.0, 5.0, 5, 0.0)
    ]
    
    zones = []
    for z_id, name, cap, occ, ent, ex, q_len, trend in zone_data:
        occ_ratio = occ / cap
        risk = calculate_risk_score(occ_ratio, ent, q_len, trend)
        status = get_risk_status(risk)
        zones.append(CrowdZone(
            id=z_id,
            name=name,
            capacity=cap,
            current_occupancy=occ,
            occupancy_ratio=occ_ratio,
            entry_rate=ent,
            exit_rate=ex,
            queue_length=q_len,
            congestion_trend=trend,
            risk_score=risk,
            status=status
        ))
    db.add_all(zones)

    # 5. Response Teams (5 Units)
    responders = [
        ResponseTeam(name="Medical Alpha", type="Medical", location="West Stand", status="Available"),
        ResponseTeam(name="Medical Bravo", type="Medical", location="East Stand", status="Available"),
        ResponseTeam(name="Security Team 1", type="Security", location="Entry Gate A", status="Available"),
        ResponseTeam(name="Security Team 2", type="Security", location="Entry Gate B", status="Available"),
        ResponseTeam(name="Technical Operations", type="Technical", location="Food Court", status="Available")
    ]
    db.add_all(responders)
    db.commit()

    # 6. Tournament: National Champions Cup 2026
    start_date = datetime.utcnow() + timedelta(days=1)
    tournament = Tournament(
        name="National Champions Cup 2026",
        sport="Soccer",
        format="Round Robin",
        num_teams=16,
        start_date=start_date,
        end_date=start_date + timedelta(days=2),
        match_duration=40,
        min_rest_time=120,
        operating_hours_start="08:00",
        operating_hours_end="22:00",
        status="Draft"
    )
    db.add(tournament)
    db.commit()

    # 7. Generate Schedule matches
    db_teams = db.query(Team).all()
    db_venues = db.query(Venue).all()
    
    matches_data = generate_round_robin_schedule(tournament, db_teams, db_venues)
    
    for m in matches_data:
        match = Match(
            id=m["id"],
            tournament_id=m["tournament_id"],
            team_a_id=m["team_a_id"],
            team_b_id=m["team_b_id"],
            venue_id=m["venue_id"],
            round=m["round"],
            original_start_time=m["original_start_time"],
            original_end_time=m["original_end_time"],
            start_time=m["start_time"],
            end_time=m["end_time"],
            status=m["status"],
            score_a=m["score_a"],
            score_b=m["score_b"],
            delay_minutes=m["delay_minutes"],
            delay_reason=m["delay_reason"],
            attendance=m["attendance"]
        )
        db.add(match)
    
    # 8. Seed Historical Events & Resolved Incidents for Analytics
    # Add historical events
    events = [
        OperationalEvent(
            title="Database Initialized",
            description="System database cleared and seeded with fresh tournament data.",
            severity="info",
            category="general"
        ),
        OperationalEvent(
            title="Demo Teams Registered",
            description="16 competition teams and 4 stadium venues registered in system.",
            severity="info",
            category="general"
        ),
        OperationalEvent(
            title="Schedules Drafted",
            description="Initial 16 matches generated and allocated to Grand Arena, Prestige Stadium, Summit Field, and Apex Bowl.",
            severity="info",
            category="schedule"
        )
    ]
    db.add_all(events)

    # Historical completed incidents
    historical_incident_1 = Incident(
        type="Equipment",
        location="West Stand",
        description="Gate A scanner ticket reader calibration issue.",
        priority="Medium",
        status="RESOLVED",
        assigned_responder_id=5, # Technical Operations
        reported_at=datetime.utcnow() - timedelta(hours=3),
        acknowledged_at=datetime.utcnow() - timedelta(hours=3) + timedelta(minutes=1),
        assigned_at=datetime.utcnow() - timedelta(hours=3) + timedelta(minutes=2),
        resolved_at=datetime.utcnow() - timedelta(hours=3) + timedelta(minutes=7),
        response_time_seconds=300 # 5 minutes
    )
    
    historical_incident_2 = Incident(
        type="Lost Person",
        location="Entry Gate A",
        description="8-year-old child separated from family near scanners.",
        priority="High",
        status="RESOLVED",
        assigned_responder_id=3, # Security Team 1
        reported_at=datetime.utcnow() - timedelta(hours=2),
        acknowledged_at=datetime.utcnow() - timedelta(hours=2) + timedelta(seconds=30),
        assigned_at=datetime.utcnow() - timedelta(hours=2) + timedelta(minutes=1),
        resolved_at=datetime.utcnow() - timedelta(hours=2) + timedelta(minutes=4),
        response_time_seconds=180 # 3 minutes
    )
    db.add(historical_incident_1)
    db.add(historical_incident_2)

    # Initial notifications
    notifs = [
        Notification(recipient="Organizer", channel="In-App", message="System loaded: National Champions Cup 2026 seeded successfully.", status="Delivered"),
        Notification(recipient="Teams", channel="SMS", message="Tournament schedule released. Check matches online.", status="Sent")
    ]
    db.add_all(notifs)

    # Audit Logs
    audit = [
        AuditLog(actor="system", role="Organizer", action="DATABASE_RESET", entity="Database", before_state="Active DB", after_state="Clean DB", reason="Demo reset requested"),
        AuditLog(actor="system", role="Organizer", action="TOURNAMENT_SEEDED", entity="Tournament National Champions Cup 2026", before_state="None", after_state="Draft Mode", reason="Demo initialization")
    ]
    db.add_all(audit)

    db.commit()
