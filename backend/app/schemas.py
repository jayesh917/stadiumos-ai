from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any, Dict, Literal

# User
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Tournament
class TournamentBase(BaseModel):
    name: str
    sport: str
    format: str
    num_teams: int
    start_date: datetime
    end_date: datetime
    match_duration: int
    min_rest_time: int
    operating_hours_start: str
    operating_hours_end: str

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Team
class TeamBase(BaseModel):
    name: str
    short_name: str

class TeamResponse(TeamBase):
    id: int

    class Config:
        from_attributes = True

# Venue
class VenueBase(BaseModel):
    name: str
    capacity: int

class VenueResponse(VenueBase):
    id: int

    class Config:
        from_attributes = True

# Match
class MatchResponse(BaseModel):
    id: str
    tournament_id: int
    team_a_id: int
    team_b_id: int
    venue_id: int
    round: int
    original_start_time: datetime
    original_end_time: datetime
    start_time: datetime
    end_time: datetime
    status: str
    score_a: int
    score_b: int
    delay_minutes: int
    delay_reason: Optional[str] = None
    attendance: int
    team_a: TeamResponse
    team_b: TeamResponse
    venue: VenueResponse

    class Config:
        from_attributes = True

class MatchDelayRequest(BaseModel):
    delay_minutes: int = Field(..., ge=1, le=480)
    delay_reason: str = Field(..., min_length=3, max_length=200)

class MatchStatusUpdateRequest(BaseModel):
    status: Literal['Scheduled', 'Live', 'Delayed', 'Completed']
    score_a: Optional[int] = Field(None, ge=0, le=150)
    score_b: Optional[int] = Field(None, ge=0, le=150)

# CrowdZone
class CrowdZoneBase(BaseModel):
    id: str
    name: str
    capacity: int
    current_occupancy: int
    occupancy_ratio: float
    entry_rate: float
    exit_rate: float
    queue_length: int
    congestion_trend: float
    risk_score: float
    status: str

class CrowdZoneResponse(CrowdZoneBase):
    class Config:
        from_attributes = True

# ResponseTeam
class ResponseTeamBase(BaseModel):
    id: int
    name: str
    type: str
    status: str
    location: str

class ResponseTeamResponse(ResponseTeamBase):
    class Config:
        from_attributes = True

# Incident
class IncidentCreate(BaseModel):
    type: Literal['Medical', 'Security', 'Crowd', 'Equipment', 'Infrastructure', 'Lost Person']
    location: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5, max_length=500)
    priority: Literal['Low', 'Medium', 'High', 'Critical']

class IncidentResponse(BaseModel):
    id: int
    type: str
    location: str
    description: str
    priority: str
    status: str
    assigned_responder_id: Optional[int] = None
    reported_at: datetime
    acknowledged_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    response_time_seconds: Optional[int] = None
    responder: Optional[ResponseTeamResponse] = None

    class Config:
        from_attributes = True

class IncidentAssignRequest(BaseModel):
    responder_id: int

class IncidentStatusRequest(BaseModel):
    status: str # REPORTED, ACKNOWLEDGED, ASSIGNED, RESPONDING, RESOLVED, CLOSED

# Alert
class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    timestamp: datetime
    resolved: bool

    class Config:
        from_attributes = True

# AIRecommendation
class AIActionSchema(BaseModel):
    action: str
    reason: str
    expected_impact: str

class AIRecommendationResponse(BaseModel):
    id: int
    scenario_type: str
    summary: str
    risk_level: str
    evidence: List[str]
    recommended_actions: List[AIActionSchema]
    affected_entities: Optional[List[str]] = None
    confidence: float
    status: str
    requires_confirmation: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Notification
class NotificationResponse(BaseModel):
    id: int
    recipient: str
    channel: str
    message: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True

# OperationalEvent
class OperationalEventResponse(BaseModel):
    id: int
    timestamp: datetime
    title: str
    description: str
    severity: str
    category: str

    class Config:
        from_attributes = True

# AuditLog
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    actor: str
    role: str
    action: str
    entity: str
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True

# Simulation Controls
class CrowdSimulateRequest(BaseModel):
    scenario: str # NORMAL, MATCH_ENDED, ENTRY_SURGE, FOOD COURT SURGE, CRITICAL_CONGESTION, RESET

class CrowdActionApplyRequest(BaseModel):
    recommendation_id: int

# Rescheduling schemas
class RescheduleImpactResponse(BaseModel):
    affected_matches: int
    venue_conflicts: int
    rest_violations: int
    tournament_finish_delay_minutes: int
    disruption_score: float
    schedule: List[MatchResponse]

class RescheduleApplyRequest(BaseModel):
    delay_minutes: int
    delay_reason: str
    schedule: List[Dict[str, Any]] # List of matches with updated times

# Schedule Conflicts response
class ConflictDetailResponse(BaseModel):
    conflict_type: str
    affected_teams: List[str]
    affected_venue: Optional[str] = None
    operational_consequence: str
    recommended_resolution: str

class ScheduleConflictsResponse(BaseModel):
    schedule_quality: int
    conflicts: List[ConflictDetailResponse]

# AI Copilot schemas
class CopilotQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)

class CopilotAction(BaseModel):
    action: str
    reason: str
    expected_impact: str

class CopilotResponseCard(BaseModel):
    summary: str
    risk_level: str # LOW | MEDIUM | HIGH | CRITICAL
    evidence: List[str]
    recommended_actions: List[CopilotAction]
    affected_entities: List[str]
    confidence: float
    requires_confirmation: bool
