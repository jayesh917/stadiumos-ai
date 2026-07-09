import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CommandCenter } from './components/CommandCenter';
import { TournamentWizard } from './components/TournamentWizard';
import { SmartScheduler } from './components/SmartScheduler';
import { LiveOperations } from './components/LiveOperations';
import { CrowdIntelligence } from './components/CrowdIntelligence';
import { IncidentCommand } from './components/IncidentCommand';
import { AICopilot } from './components/AICopilot';
import { Analytics } from './components/Analytics';
import { NotificationsPanel } from './components/NotificationsPanel';
import { AuditLogView } from './components/AuditLogView';
import { Settings } from './components/Settings';
import { useWebSocket } from './websocket';
import { API_BASE_URL } from './config';
import { 
  User, 
  Tournament, 
  Match, 
  CrowdZone, 
  Incident, 
  ResponseTeam, 
  Alert, 
  AIRecommendation, 
  Notification, 
  OperationalEvent, 
  AuditLog, 
  AnalyticsData 
} from './types';
import { 
  Play, 
  SkipForward, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Info,
  Pause,
  AlertTriangle,
  Flame,
  Activity,
  HeartPulse
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('tournaments');
  const [currentUser, setCurrentUser] = useState<User>({ id: 1, username: 'operations', role: 'Operations Manager' });
  const [wsConnected, setWsConnected] = useState(false);

  // Core telemetries state
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [zones, setZones] = useState<CrowdZone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<ResponseTeam[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    avg_incident_response_time_mins: 4.2,
    schedule_conflicts_prevented: 5,
    avg_crowd_wait_time_mins: 1.2,
    critical_crowd_events: 0,
    venue_utilization_pct: 78,
    schedule_disruption_score: 0,
    ai_recommendations_accepted: 0
  });

  // Scheduling propose state
  const [scheduleProposal, setScheduleProposal] = useState<any | null>(null);
  const [qualityScore, setQualityScore] = useState(100);
  const [scheduleConflicts, setScheduleConflicts] = useState<any[]>([]);

  // Demo step control state
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Base API configuration
  const API_BASE = `${API_BASE_URL}/api`;

  // REST API Telemetry Fetchers
  const fetchAllTelemetry = async () => {
    try {
      // Tournaments
      const tRes = await fetch(`${API_BASE}/tournaments`);
      const tData = await tRes.json();
      if (tData.length > 0) setTournament(tData[0]);
      else setTournament(null);

      // Matches
      const mRes = await fetch(`${API_BASE}/matches`);
      setMatches(await mRes.json());

      // Conflicts
      const cRes = await fetch(`${API_BASE}/schedule/conflicts`);
      const cData = await cRes.json();
      setQualityScore(cData.schedule_quality);
      setScheduleConflicts(cData.conflicts);

      // Crowd Zones
      const zRes = await fetch(`${API_BASE}/crowd/zones`);
      setZones(await zRes.json());

      // Incidents
      const iRes = await fetch(`${API_BASE}/incidents`);
      setIncidents(await iRes.json());

      // Responders
      // Since backend responder models are bound to Incident response team relational references, we fetch them via database query
      const rRes = await fetch(`${API_BASE}/incidents`); // fallback fetch
      // We also mock responder state fetch internally
      const mockResponders: ResponseTeam[] = [
        { id: 1, name: 'Medical Alpha', type: 'Medical', location: 'West Stand', status: 'Available' },
        { id: 2, name: 'Medical Bravo', type: 'Medical', location: 'East Stand', status: 'Available' },
        { id: 3, name: 'Security Team 1', type: 'Security', location: 'Entry Gate A', status: 'Available' },
        { id: 4, name: 'Security Team 2', type: 'Security', location: 'Entry Gate B', status: 'Available' },
        { id: 5, name: 'Technical Operations', type: 'Technical', location: 'Food Court', status: 'Available' }
      ];
      // Sync responders busy state with incidents list
      const activeIncidents = incidents.filter(inc => inc.status === 'ASSIGNED');
      activeIncidents.forEach(inc => {
        if (inc.assigned_responder_id) {
          const resp = mockResponders.find(r => r.id === inc.assigned_responder_id);
          if (resp) resp.status = 'Busy';
        }
      });
      setResponders(mockResponders);

      // Notifications
      const nRes = await fetch(`${API_BASE}/notifications`);
      setNotifications(await nRes.json());

      // Events
      const eRes = await fetch(`${API_BASE}/events`);
      setEvents(await eRes.json());

      // Audits
      const auRes = await fetch(`${API_BASE}/audit`);
      setAuditLogs(await auRes.json());

      // Analytics
      const anRes = await fetch(`${API_BASE}/analytics`);
      setAnalytics(await anRes.json());

    } catch (err) {
      console.warn('Backend API connection offline. Retrying...', err);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
    const interval = setInterval(fetchAllTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebSockets Telemetry Handler
  const handleWebSocketEvent = (type: string, data: any) => {
    setWsConnected(true);
    console.log(`WebSocket Telemetry: [${type}]`, data);
    
    switch (type) {
      case 'CROWD_STATE_UPDATED':
        setZones(data);
        break;
      case 'CROWD_ALERT_CREATED':
        setAlerts(prev => [data, ...prev]);
        break;
      case 'AI_RECOMMENDATION_CREATED':
        setRecs(prev => [data, ...prev]);
        break;
      case 'NOTIFICATION_CREATED':
        setNotifications(prev => [data, ...prev]);
        break;
      case 'OPERATIONAL_EVENT_CREATED':
        setEvents(prev => [data, ...prev]);
        break;
      case 'MATCH_UPDATED':
      case 'MATCH_DELAYED':
      case 'SCHEDULE_UPDATED':
      case 'INCIDENT_CREATED':
      case 'INCIDENT_UPDATED':
      default:
        fetchAllTelemetry();
        break;
    }
  };

  // Connect WebSocket hook
  useWebSocket(handleWebSocketEvent);

  // REST API Methods binding
  const handleLoadDemo = async () => {
    const res = await fetch(`${API_BASE}/tournaments/load-demo`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await fetchAllTelemetry();
      setActiveTab('scheduler');
    }
  };

  const handleCreateTournament = async (formData: any) => {
    const res = await fetch(`${API_BASE}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      await fetchAllTelemetry();
      setActiveTab('scheduler');
    }
  };

  const handleStartMatch = async (matchId: string) => {
    await fetch(`${API_BASE}/matches/${matchId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Live' })
    });
    await fetchAllTelemetry();
  };

  const handleEndMatch = async (matchId: string, scoreA: number, scoreB: number) => {
    await fetch(`${API_BASE}/matches/${matchId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed', score_a: scoreA, score_b: scoreB })
    });
    await fetchAllTelemetry();
  };

  const handleAddDelay = async (matchId: string, delayMinutes: number, reason: string) => {
    await fetch(`${API_BASE}/matches/${matchId}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay_minutes: delayMinutes, delay_reason: reason })
    });
    await fetchAllTelemetry();
  };

  const handleOptimizeSchedule = async () => {
    // Delays are applied, call optimization preview
    const res = await fetch(`${API_BASE}/schedule/optimize`, { method: 'POST' });
    const proposalSchedule = await res.json();
    
    // Simulate before vs after metrics
    const targetMatch = matches.find(m => m.status === 'Delayed');
    const delayMins = targetMatch ? targetMatch.delay_minutes : 40;
    
    const impactRes = await fetch(`${API_BASE}/schedule/simulate-delay?match_id=M08`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay_minutes: delayMins, delay_reason: 'Inclement Weather' })
    });
    const impactData = await impactRes.json();
    setScheduleProposal(impactData);
  };

  const handleApplyReschedule = async (proposal: any) => {
    const res = await fetch(`${API_BASE}/schedule/apply-reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delay_minutes: 40,
        delay_reason: 'Inclement Weather',
        schedule: proposal.schedule
      })
    });
    if (res.ok) {
      confetti({ particleCount: 50, colors: ['#00b0ff', '#00e676'] });
      setScheduleProposal(null);
      await fetchAllTelemetry();
    }
  };

  const handleTriggerCrowdScenario = async (scenario: string) => {
    await fetch(`${API_BASE}/crowd/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    await fetchAllTelemetry();
  };

  const handleApplyCrowdAction = async (recId: number) => {
    const res = await fetch(`${API_BASE}/crowd/apply-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId })
    });
    if (res.ok) {
      confetti({ particleCount: 50, colors: ['#00e676', '#00b0ff'] });
      // Remove applied recommendation from state
      setRecs(prev => prev.filter(r => r.id !== recId));
      await fetchAllTelemetry();
    }
  };

  const handleReportIncident = async (data: any) => {
    await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    await fetchAllTelemetry();
  };

  const handleAssignResponder = async (incidentId: number, responderId: number) => {
    await fetch(`${API_BASE}/incidents/${incidentId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responder_id: responderId })
    });
    await fetchAllTelemetry();
  };

  const handleResolveIncident = async (incidentId: number) => {
    await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' })
    });
    await fetchAllTelemetry();
  };

  const handleCopilotQuery = async (text: string) => {
    const res = await fetch(`${API_BASE}/ai/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    });
    return await res.json();
  };

  // Demo mode steps configuration
  const demoSteps = [
    {
      title: '1. Initialize StadiumOS Workspace',
      tab: 'tournaments',
      desc: 'Drop tables, setup standard operator roles, seed 16 teams, 4 venues, 9 crowd zones, and draft conflict-free schedules.',
      action: async () => {
        await handleLoadDemo();
      }
    },
    {
      title: '2. Inspect Schedule Alignment',
      tab: 'scheduler',
      desc: 'Smart Scheduler verifies that the 16 parallel matches comply with hard rules (no double venue or team booking) resulting in a Quality Index of 100.',
      action: async () => {
        // Just inspect
      }
    },
    {
      title: '3. Tournament Operations Live',
      tab: 'live-operations',
      desc: 'Matches kick off across stadium bowls. Let us start Match M01, M02, M03, and M04 live in their respective arenas.',
      action: async () => {
        // Start matches
        await handleStartMatch('M01');
        await handleStartMatch('M02');
        await handleStartMatch('M03');
        await handleStartMatch('M04');
      }
    },
    {
      title: '4. Ingress Crowd Bottleneck',
      tab: 'command-center',
      desc: 'Spectator gate telemetry registers a chokepoint! Entry Gate B queue surges to 185 pax. AI registers a CRITICAL alert and proposes mitigation.',
      action: async () => {
        await handleTriggerCrowdScenario('CRITICAL_CONGESTION');
      }
    },
    {
      title: '5. Mitigate Crowd Congestion',
      tab: 'crowd-intelligence',
      desc: 'Operator approves the AI action plan. Scanning channels open at Gate C, diverting spectator flow, stabilizing Gate B risk score.',
      action: async () => {
        // Find crowd rec
        const cr = recs.find(r => r.scenario_type === 'crowd' && r.status === 'Pending');
        if (cr) await handleApplyCrowdAction(cr.id);
        else {
          // Fallback call
          await fetch(`${API_BASE}/crowd/apply-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recommendation_id: 1 })
          });
          await fetchAllTelemetry();
        }
      }
    },
    {
      title: '6. Medical Dispatch Emergency',
      tab: 'incidents',
      desc: 'Medical emergency reported in East Stand. System evaluates available units, recommending Medical Bravo (ETA: 2 minutes). Operator dispatches Bravo.',
      action: async () => {
        // Trigger medical incident
        await handleReportIncident({
          type: 'Medical',
          location: 'East Stand',
          description: 'Spectator experiencing chest pain in East Stand row 14.',
          priority: 'Critical'
        });
      }
    },
    {
      title: '7. Weather Delay Exception',
      tab: 'live-operations',
      desc: 'Sudden rainstorm delays Match M08 by 40 minutes. Disruption score surges, and scheduling solver detects venue overlaps.',
      action: async () => {
        // Resolve incident first for clean demo flow
        const activeMed = incidents.find(i => i.type === 'Medical' && i.status !== 'RESOLVED');
        if (activeMed) {
          // Assign and resolve
          await handleAssignResponder(activeMed.id, 2);
          await handleResolveIncident(activeMed.id);
        }
        await handleAddDelay('M08', 40, 'Severe Lightning Storm');
      }
    },
    {
      title: '8. AI Rescheduling & Final Impact',
      tab: 'scheduler',
      desc: 'AI solver computes alternative timeline. Conflicting matches are shifted chronologically. Operator applies rescheduled plan, restoring quality to 100.',
      action: async () => {
        await handleOptimizeSchedule();
      }
    }
  ];

  const handleNextDemoStep = async () => {
    const nextStep = (currentDemoStep + 1) % demoSteps.length;
    setCurrentDemoStep(nextStep);
    
    // Auto navigate to the correct tab for the step
    const targetTab = demoSteps[nextStep].tab;
    setActiveTab(targetTab);

    // Run programmatic step action
    const stepAction = demoSteps[nextStep].action;
    if (stepAction) {
      await stepAction();
    }
  };

  const handleResetDemo = async () => {
    setCurrentDemoStep(0);
    setActiveTab('tournaments');
    setScheduleProposal(null);
    setAlerts([]);
    setRecs([]);
    setAutoPlay(false);
    
    const res = await fetch(`${API_BASE}/tournaments/load-demo`, { method: 'POST' });
    if (res.ok) {
      await fetchAllTelemetry();
    }
  };

  // Auto-play timer effect
  useEffect(() => {
    let timer: number;
    if (autoPlay) {
      timer = window.setInterval(() => {
        handleNextDemoStep();
      }, 10000); // Step every 10 seconds
    }
    return () => clearInterval(timer);
  }, [autoPlay, currentDemoStep]);

  // Triggered by Copilot card quick-actions
  const handleTriggerTabAction = async (actionType: string, payload?: any) => {
    if (actionType === 'CROWD_MITIGATION') {
      setActiveTab('crowd-intelligence');
    } else if (actionType === 'SCHEDULE_OPTIMIZE') {
      setActiveTab('scheduler');
      await handleOptimizeSchedule();
    } else if (actionType === 'INCIDENT_DISPATCH') {
      setActiveTab('incidents');
    }
  };

  return (
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden font-sans select-none">
      
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onUserRoleChange={(role) => setCurrentUser({ ...currentUser, role })}
        wsConnected={wsConnected}
        activeIncidentCount={incidents.filter(i => i.status !== 'RESOLVED').length}
        criticalZoneCount={zones.filter(z => z.status === 'CRITICAL').length}
      />

      {/* Main Command Dashboard Scope */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* Top Demo Overlay Bar */}
        <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between relative z-20">
          
          {/* Step telemetry info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/10 to-primary-dark/10 border border-primary/20 rounded-md text-[10px] font-bold text-primary tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Scenario: Step {currentDemoStep + 1}/{demoSteps.length}
            </div>
            <div className="text-[11px] font-bold text-white uppercase hidden lg:block tracking-wide">
              {demoSteps[currentDemoStep].title}
            </div>
            <p className="text-[9px] text-gray-400 font-sans hidden xl:block leading-snug max-w-[400px]">
              {demoSteps[currentDemoStep].desc}
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex gap-2">
            <button
              onClick={handleResetDemo}
              className="bg-surface-light border border-border text-gray-400 hover:text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" /> Reset
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-1 ${
                autoPlay 
                  ? 'bg-status-amber text-black' 
                  : 'bg-surface-light border border-border text-gray-400 hover:text-white'
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 text-status-green" />}
              {autoPlay ? 'Pause Auto' : 'Auto Play'}
            </button>
            <button
              onClick={handleNextDemoStep}
              className="bg-primary text-black hover:bg-primary-dark text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded flex items-center gap-1 shadow shadow-primary/20 transition-all"
            >
              Next Step <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Scrollable telemetries content area */}
        <div className="flex-grow overflow-y-auto p-6 bg-background">
          {activeTab === 'command-center' && (
            <CommandCenter
              zones={zones}
              incidents={incidents}
              events={events}
              alerts={alerts}
              recs={recs}
              analytics={analytics}
              matches={matches}
              onApplyCrowdAction={handleApplyCrowdAction}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'tournaments' && (
            <TournamentWizard
              tournament={tournament}
              onLoadDemo={handleLoadDemo}
              onCreateTournament={handleCreateTournament}
            />
          )}

          {activeTab === 'scheduler' && (
            <SmartScheduler
              tournament={tournament}
              matches={matches}
              qualityScore={qualityScore}
              conflicts={scheduleConflicts}
              rescheduleProposal={scheduleProposal}
              onGenerateSchedule={async () => {
                await fetch(`${API_BASE}/schedule/generate`, { method: 'POST' });
                await fetchAllTelemetry();
              }}
              onDetectConflicts={fetchAllTelemetry}
              onOptimizeSchedule={handleOptimizeSchedule}
              onApplyReschedule={handleApplyReschedule}
              onExplainPlan={() => setActiveTab('ai-copilot')}
              onClearProposal={() => setScheduleProposal(null)}
            />
          )}

          {activeTab === 'live-operations' && (
            <LiveOperations
              matches={matches}
              onStartMatch={handleStartMatch}
              onEndMatch={handleEndMatch}
              onAddDelay={handleAddDelay}
            />
          )}

          {activeTab === 'crowd-intelligence' && (
            <CrowdIntelligence
              zones={zones}
              crowdRecs={recs}
              onTriggerScenario={handleTriggerCrowdScenario}
              onApplyAction={handleApplyCrowdAction}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentCommand
              incidents={incidents}
              responders={responders}
              incidentRecs={recs}
              onReportIncident={handleReportIncident}
              onAssignResponder={handleAssignResponder}
              onResolveIncident={handleResolveIncident}
            />
          )}

          {activeTab === 'ai-copilot' && (
            <AICopilot
              onCopilotQuery={handleCopilotQuery}
              onTriggerTabAction={handleTriggerTabAction}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel notifications={notifications} />
          )}

          {activeTab === 'analytics' && (
            <Analytics analytics={analytics} />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogView auditLogs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <Settings onResetDemo={handleResetDemo} />
          )}
        </div>

      </main>
    </div>
  );
}
