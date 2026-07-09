from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False) # Organizer, Operations Manager, Security Officer, Medical Coordinator
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sport = Column(String, nullable=False)
    format = Column(String, nullable=False)
    num_teams = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    match_duration = Column(Integer, default=40) # in minutes
    min_rest_time = Column(Integer, default=120)  # in minutes
    operating_hours_start = Column(String, default="08:00")
    operating_hours_end = Column(String, default="22:00")
    status = Column(String, default="Draft") # Draft, Scheduled, Live, Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    short_name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matches = relationship("Match", back_populates="venue")

class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, index=True) # e.g. M01
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    team_a_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team_b_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    round = Column(Integer, nullable=False)
    original_start_time = Column(DateTime, nullable=False)
    original_end_time = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, default="Scheduled") # Scheduled, Live, Delayed, Completed
    score_a = Column(Integer, default=0)
    score_b = Column(Integer, default=0)
    delay_minutes = Column(Integer, default=0)
    delay_reason = Column(String, nullable=True)
    attendance = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    venue = relationship("Venue", back_populates="matches")
    team_a = relationship("Team", foreign_keys=[team_a_id])
    team_b = relationship("Team", foreign_keys=[team_b_id])

class CrowdZone(Base):
    __tablename__ = "crowd_zones"

    id = Column(String, primary_key=True, index=True) # north_stand, gate_b, etc.
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    occupancy_ratio = Column(Float, default=0.0)
    entry_rate = Column(Float, default=0.0) # pax / min
    exit_rate = Column(Float, default=0.0)  # pax / min
    queue_length = Column(Integer, default=0)
    congestion_trend = Column(Float, default=0.0) # +ive or -ive change
    risk_score = Column(Float, default=0.0) # 0 - 100
    status = Column(String, default="NORMAL") # NORMAL, WATCH, HIGH, CRITICAL
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CrowdReading(Base):
    __tablename__ = "crowd_readings"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("crowd_zones.id"), nullable=False)
    occupancy = Column(Integer, nullable=False)
    entry_rate = Column(Float, nullable=False)
    exit_rate = Column(Float, nullable=False)
    queue_length = Column(Integer, nullable=False)
    risk_score = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False) # Medical, Security, Crowd, Equipment, Infrastructure, Lost Person
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, nullable=False) # Low, Medium, High, Critical
    status = Column(String, default="REPORTED") # REPORTED, ACKNOWLEDGED, ASSIGNED, RESPONDING, RESOLVED, CLOSED
    assigned_responder_id = Column(Integer, ForeignKey("response_teams.id"), nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    response_time_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responder = relationship("ResponseTeam", back_populates="incidents")

class ResponseTeam(Base):
    __tablename__ = "response_teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False) # Medical, Security, Technical
    status = Column(String, default="Available") # Available, Busy, Offline
    location = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incidents = relationship("Incident", back_populates="responder")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False) # Info, Warning, Critical
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_type = Column(String, nullable=False) # crowd, schedule, incident
    summary = Column(Text, nullable=False)
    risk_level = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    evidence = Column(JSON, nullable=False) # List of strings/evidence
    recommended_actions = Column(JSON, nullable=False) # List of objects: {action, reason, expected_impact}
    affected_entities = Column(JSON, nullable=True) # List of affected match/team/zone IDs
    confidence = Column(Float, default=0.0) # 0.0 to 1.0
    status = Column(String, default="Pending") # Pending, Applied, Rejected
    requires_confirmation = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, nullable=False) # Organizer, Team Name, Security, Medical, Spectators, etc.
    channel = Column(String, nullable=False) # In-App, SMS, Email, Push
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Sent") # Sent, Delivered, Failed

class OperationalEvent(Base):
    __tablename__ = "operational_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="info") # info, warning, error, critical
    category = Column(String, default="general") # match, crowd, incident, schedule

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False) # e.g. ACTION_PLAN_APPROVED, MATCH_DELAYED
    entity = Column(String, nullable=False) # e.g. Match M08, CrowdZone Gate B
    before_state = Column(Text, nullable=True)
    after_state = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
