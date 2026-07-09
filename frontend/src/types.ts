export interface User {
  id: number;
  username: string;
  role: 'Organizer' | 'Operations Manager' | 'Security Officer' | 'Medical Coordinator';
}

export interface Tournament {
  id: number;
  name: string;
  sport: string;
  format: string;
  num_teams: number;
  start_date: string;
  end_date: string;
  match_duration: number;
  min_rest_time: number;
  operating_hours_start: string;
  operating_hours_end: string;
  status: 'Draft' | 'Scheduled' | 'Live' | 'Completed';
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
}

export interface Venue {
  id: number;
  name: string;
  capacity: number;
}

export interface Match {
  id: string;
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  venue_id: number;
  round: number;
  original_start_time: string;
  original_end_time: string;
  start_time: string;
  end_time: string;
  status: 'Scheduled' | 'Live' | 'Delayed' | 'Completed';
  score_a: number;
  score_b: number;
  delay_minutes: number;
  delay_reason: string | null;
  attendance: number;
  team_a: Team;
  team_b: Team;
  venue: Venue;
}

export interface CrowdZone {
  id: string;
  name: string;
  capacity: number;
  current_occupancy: number;
  occupancy_ratio: number;
  entry_rate: number;
  exit_rate: number;
  queue_length: number;
  congestion_trend: number;
  risk_score: number;
  status: 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL';
}

export interface ResponseTeam {
  id: number;
  name: string;
  type: 'Medical' | 'Security' | 'Technical';
  status: 'Available' | 'Busy' | 'Offline';
  location: string;
}

export interface Incident {
  id: number;
  type: 'Medical' | 'Security' | 'Crowd' | 'Equipment' | 'Infrastructure' | 'Lost Person';
  location: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESPONDING' | 'RESOLVED' | 'CLOSED';
  assigned_responder_id: number | null;
  reported_at: string;
  acknowledged_at: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  response_time_seconds: number | null;
  responder?: ResponseTeam;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  timestamp: string;
  resolved: boolean;
}

export interface AIAction {
  action: string;
  reason: string;
  expected_impact: string;
}

export interface AIRecommendation {
  id: number;
  scenario_type: 'crowd' | 'schedule' | 'incident';
  summary: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
  recommended_actions: AIAction[];
  affected_entities: string[] | null;
  confidence: number;
  status: 'Pending' | 'Applied' | 'Rejected';
  requires_confirmation: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  recipient: string;
  channel: 'In-App' | 'SMS' | 'Email' | 'Push';
  message: string;
  timestamp: string;
  status: 'Sent' | 'Delivered' | 'Failed';
}

export interface OperationalEvent {
  id: number;
  timestamp: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'success';
  category: 'match' | 'crowd' | 'incident' | 'schedule' | 'general';
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  before_state: string | null;
  after_state: string | null;
  reason: string | null;
}

export interface AnalyticsData {
  avg_incident_response_time_mins: number;
  schedule_conflicts_prevented: number;
  avg_crowd_wait_time_mins: number;
  critical_crowd_events: number;
  venue_utilization_pct: number;
  schedule_disruption_score: number;
  ai_recommendations_accepted: number;
}
