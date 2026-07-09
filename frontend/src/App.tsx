import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AnalyticsData,
  ConflictDetail,
  RescheduleImpact,
  CopilotResponse
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
  HeartPulse,
  Volume2,
  VolumeX,
  Plus
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
  const [scheduleProposal, setScheduleProposal] = useState<RescheduleImpact | null>(null);
  const [qualityScore, setQualityScore] = useState(100);
  const [scheduleConflicts, setScheduleConflicts] = useState<ConflictDetail[]>([]);

  // Demo step control state
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isDemoActionRunning, setIsDemoActionRunning] = useState(false);

  // Accessibility state
  const [largeText, setLargeText] = useState(() => localStorage.getItem('stadiumos-large-text') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('stadiumos-high-contrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('stadiumos-reduced-motion') === 'true');
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('stadiumos-sound-alerts') !== 'false');

  // Emergency state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState('Medical Emergency');
  const [emergencyLocation, setEmergencyLocation] = useState('East Stand');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [isReportingEmergency, setIsReportingEmergency] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Stadium operations workspace ready.');

  // Base API configuration
  const API_BASE = `${API_BASE_URL}/api`;

  const prefersReducedMotion = useCallback(() => {
    return reducedMotion || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [reducedMotion]);

  const celebrate = useCallback((options?: any) => {
    if (!prefersReducedMotion()) {
      confetti(options);
    }
  }, [prefersReducedMotion]);

  // Operational sound alert function using Web Audio oscillator synthesis
  const playAlertSound = useCallback(() => {
    if (!soundAlerts || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }, [soundAlerts]);

  // Effects to synchronize preferences
  useEffect(() => {
    if (largeText) {
      document.documentElement.style.fontSize = '18px';
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.style.fontSize = '16px';
      document.documentElement.classList.remove('large-text');
    }
    localStorage.setItem('stadiumos-large-text', String(largeText));
  }, [largeText]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('stadiumos-high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    localStorage.setItem('stadiumos-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('stadiumos-sound-alerts', String(soundAlerts));
  }, [soundAlerts]);

  // Keyboard handlers and focus trap for the Emergency Modal
  useEffect(() => {
    if (!showEmergencyModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmergencyModal(false);
      }
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;
        const focusables = modal.querySelectorAll('button, select, textarea');
        if (focusables.length === 0) return;
        const first = focusables[0] as HTMLElement;
        const last = focusables[focusables.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const select = document.getElementById('emergency-cat');
    if (select) {
      setTimeout(() => select.focus(), 50);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEmergencyModal]);


  const fetchInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchJSON = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      const signal = abortControllerRef.current?.signal;
      const res = await fetch(`${API_BASE}${path}`, { ...options, signal });
      if (!res.ok) {
        throw new Error(`Request failed for ${path} with status ${res.status}`);
      }
      return res.json() as Promise<T>;
    },
    [API_BASE]
  );

  const fetchAllTelemetry = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    // Cancel previous ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const [
        tData,
        mData,
        cData,
        zData,
        iData,
        nData,
        eData,
        auData,
        anData
      ] = await Promise.all([
        fetchJSON<Tournament[]>('/tournaments'),
        fetchJSON<Match[]>('/matches'),
        fetchJSON<{ schedule_quality: number; conflicts: ConflictDetail[] }>('/schedule/conflicts'),
        fetchJSON<CrowdZone[]>('/crowd/zones'),
        fetchJSON<Incident[]>('/incidents'),
        fetchJSON<Notification[]>('/notifications'),
        fetchJSON<OperationalEvent[]>('/events'),
        fetchJSON<AuditLog[]>('/audit'),
        fetchJSON<AnalyticsData>('/analytics')
      ]);

      if (tData.length > 0) setTournament(tData[0]);
      else setTournament(null);

      setMatches(mData);
      setQualityScore(cData.schedule_quality);
      setScheduleConflicts(cData.conflicts);
      setZones(zData);
      setIncidents(iData);

      // Sync mock responders
      const mockResponders: ResponseTeam[] = [
        { id: 1, name: 'Medical Alpha', type: 'Medical', location: 'West Stand', status: 'Available' },
        { id: 2, name: 'Medical Bravo', type: 'Medical', location: 'East Stand', status: 'Available' },
        { id: 3, name: 'Security Team 1', type: 'Security', location: 'Entry Gate A', status: 'Available' },
        { id: 4, name: 'Security Team 2', type: 'Security', location: 'Entry Gate B', status: 'Available' },
        { id: 5, name: 'Technical Operations', type: 'Technical', location: 'Food Court', status: 'Available' }
      ];

      const activeIncidents = iData.filter(inc => inc.status === 'ASSIGNED');
      activeIncidents.forEach(inc => {
        if (inc.assigned_responder_id) {
          const resp = mockResponders.find(r => r.id === inc.assigned_responder_id);
          if (resp) resp.status = 'Busy';
        }
      });
      setResponders(mockResponders);

      setNotifications(nData);
      setEvents(eData);
      setAuditLogs(auData);
      setAnalytics(anData);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Backend API connection offline. Retrying...', err);
      }
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [fetchJSON]);

  // Polling strategy with hidden page detection
  useEffect(() => {
    fetchAllTelemetry();

    const interval = setInterval(() => {
      if (document.hidden) {
        // Skip polling when page is inactive to save battery/bandwidth
        return;
      }
      fetchAllTelemetry();
    }, 8000); // 8-second slow fallback interval

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllTelemetry]);

  // WebSockets Telemetry Handler
  const handleWebSocketEvent = useCallback((type: string, data: any) => {
    setWsConnected(true);
    console.log(`WebSocket Telemetry: [${type}]`, data);

    switch (type) {
      case 'CROWD_STATE_UPDATED':
        setZones(data);
        setStatusMessage('Crowd state updated.');
        break;
      case 'CROWD_ALERT_CREATED':
        setAlerts(prev => [data, ...prev]);
        if (data.severity === 'Critical') {
          playAlertSound();
        }
        setStatusMessage(`New crowd safety warning: ${data.message}`);
        break;
      case 'AI_RECOMMENDATION_CREATED':
        setRecs(prev => [data, ...prev]);
        if (data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH') {
          playAlertSound();
        }
        setStatusMessage(`AI recommendation issued: ${data.summary}`);
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
  }, [fetchAllTelemetry, playAlertSound]);

  // Connect WebSocket hook
  useWebSocket(handleWebSocketEvent, setWsConnected);

  // REST API Methods binding
  const handleLoadDemo = async () => {
    const res = await fetch(`${API_BASE}/tournaments/load-demo`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      celebrate({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await fetchAllTelemetry();
      setActiveTab('scheduler');
      setStatusMessage('Demo tournament loaded successfully. Operations center initialized.');
    }
  };

  const handleCreateTournament = async (formData: unknown) => {
    const res = await fetch(`${API_BASE}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      await fetchAllTelemetry();
      setActiveTab('scheduler');
      setStatusMessage('Tournament created successfully. Smart scheduler active.');
    }
  };

  const handleStartMatch = async (matchId: string) => {
    await fetch(`${API_BASE}/matches/${matchId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Live' })
    });
    await fetchAllTelemetry();
    setStatusMessage(`Match ${matchId} has started.`);
  };

  const handleEndMatch = async (matchId: string, scoreA: number, scoreB: number) => {
    await fetch(`${API_BASE}/matches/${matchId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed', score_a: scoreA, score_b: scoreB })
    });
    await fetchAllTelemetry();
    setStatusMessage(`Match ${matchId} ended. Score: ${scoreA} - ${scoreB}.`);
  };

  const handleAddDelay = async (matchId: string, delayMinutes: number, reason: string) => {
    await fetch(`${API_BASE}/matches/${matchId}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay_minutes: delayMinutes, delay_reason: reason })
    });
    await fetchAllTelemetry();
    setStatusMessage(`Recorded ${delayMinutes} mins weather delay for ${matchId}.`);
  };

  const handleOptimizeSchedule = async () => {
    const res = await fetch(`${API_BASE}/schedule/optimize`, { method: 'POST' });
    await res.json();

    const targetMatch = matches.find(m => m.status === 'Delayed');
    const delayMins = targetMatch ? targetMatch.delay_minutes : 40;

    const impactRes = await fetch(`${API_BASE}/schedule/simulate-delay?match_id=M08`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay_minutes: delayMins, delay_reason: 'Inclement Weather' })
    });
    const impactData = await impactRes.json();
    setScheduleProposal(impactData);
    setStatusMessage('AI schedule solver proposal calculated. Review stats comparison.');
  };

  const handleApplyReschedule = async (proposal: RescheduleImpact) => {
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
      celebrate({ particleCount: 50, colors: ['#00b0ff', '#00e676'] });
      setScheduleProposal(null);
      await fetchAllTelemetry();
      setStatusMessage('Optimized reschedule applied. Schedule quality restored to 100.');
    }
  };

  const handleTriggerCrowdScenario = async (scenario: string) => {
    await fetch(`${API_BASE}/crowd/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    await fetchAllTelemetry();
    setStatusMessage(`Crowd simulation scenario triggered: ${scenario}.`);
  };

  const handleApplyCrowdAction = async (recId: number) => {
    const res = await fetch(`${API_BASE}/crowd/apply-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId })
    });
    if (res.ok) {
      celebrate({ particleCount: 50, colors: ['#00e676', '#00b0ff'] });
      setRecs(prev => prev.filter(r => r.id !== recId));
      await fetchAllTelemetry();
      setStatusMessage('AI crowd mitigation deployed. Scanning lanes expanded.');
    }
  };

  const handleReportIncident = async (data: Partial<Incident>) => {
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
    setStatusMessage('Incident assigned to emergency team.');
  };

  const handleResolveIncident = async (incidentId: number) => {
    await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' })
    });
    await fetchAllTelemetry();
    setStatusMessage('Incident resolved successfully.');
  };

  const handleCopilotQuery = async (text: string): Promise<CopilotResponse> => {
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
        const cr = recs.find(r => r.scenario_type === 'crowd' && r.status === 'Pending');
        if (cr) await handleApplyCrowdAction(cr.id);
        else {
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
        const activeMed = incidents.find(i => i.type === 'Medical' && i.status !== 'RESOLVED');
        if (activeMed) {
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
    if (isDemoActionRunning) return;
    setIsDemoActionRunning(true);
    const nextStep = (currentDemoStep + 1) % demoSteps.length;
    setCurrentDemoStep(nextStep);

    const targetTab = demoSteps[nextStep].tab;
    setActiveTab(targetTab);

    setStatusMessage(`Running demo step ${nextStep + 1}: ${demoSteps[nextStep].title}`);

    try {
      const stepAction = demoSteps[nextStep].action;
      if (stepAction) {
        await stepAction();
      }
      setStatusMessage(`Demo step ${nextStep + 1} completed: ${demoSteps[nextStep].title}`);
    } catch (error) {
      console.error(error);
      setAutoPlay(false);
      setStatusMessage(`Demo step ${nextStep + 1} failed. Autoplay stopped.`);
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  const handlePrevDemoStep = async () => {
    if (isDemoActionRunning) return;
    setIsDemoActionRunning(true);
    const prevStep = (currentDemoStep - 1 + demoSteps.length) % demoSteps.length;
    setCurrentDemoStep(prevStep);

    const targetTab = demoSteps[prevStep].tab;
    setActiveTab(targetTab);
    setStatusMessage(`Navigated back to step ${prevStep + 1}: ${demoSteps[prevStep].title}`);
    setIsDemoActionRunning(false);
  };

  const handleResetDemo = async () => {
    if (isDemoActionRunning) return;
    setIsDemoActionRunning(true);
    setCurrentDemoStep(0);
    setActiveTab('tournaments');
    setScheduleProposal(null);
    setAlerts([]);
    setRecs([]);
    setAutoPlay(false);

    try {
      const res = await fetch(`${API_BASE}/tournaments/load-demo`, { method: 'POST' });
      if (res.ok) {
        await fetchAllTelemetry();
        setStatusMessage('Demo database reset completed. Fresh operations panel ready.');
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('Demo reset failed.');
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  // Auto-play timer effect
  useEffect(() => {
    let timer: number;
    if (autoPlay && !isDemoActionRunning) {
      timer = window.setInterval(() => {
        handleNextDemoStep();
      }, 10000);
    }
    return () => clearInterval(timer);
  }, [autoPlay, currentDemoStep, isDemoActionRunning]);

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
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden font-sans">

      {/* Keyboard accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Screen reader status announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

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
      <main id="main-content" tabIndex={-1} className="flex-grow flex flex-col min-w-0 outline-none">

        {/* Top Demo Overlay Bar */}
        <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between relative z-20">

          {/* Step telemetry info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/10 to-primary-dark/10 border border-primary/20 rounded-md text-[10px] font-bold text-primary tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Hackathon Scenario: Step {currentDemoStep + 1}/{demoSteps.length}
            </div>
            <div className="text-[11px] font-bold text-white uppercase hidden lg:block tracking-wide">
              {demoSteps[currentDemoStep].title}
            </div>
            <p className="text-[9px] text-gray-400 font-sans hidden xl:block leading-snug max-w-[400px]">
              {demoSteps[currentDemoStep].desc}
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex gap-2" role="group" aria-label="Demonstration Controls">
            <button
              type="button"
              onClick={() => setSoundAlerts(!soundAlerts)}
              aria-pressed={soundAlerts}
              aria-label={soundAlerts ? 'Mute sound alerts' : 'Unmute sound alerts'}
              className="min-h-11 bg-surface-light border border-border text-gray-300 hover:text-white px-3 py-1.5 rounded flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {soundAlerts ? <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="min-h-11 bg-status-red hover:bg-status-red/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow shadow-status-red/20"
            >
              <Plus className="w-3.5 h-3.5 text-white" aria-hidden="true" /> Report Emergency
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isDemoActionRunning}
              className="bg-surface-light border border-border text-gray-400 hover:text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Reset
            </button>

            <button
              type="button"
              onClick={handlePrevDemoStep}
              disabled={isDemoActionRunning}
              className="bg-surface-light border border-border text-gray-400 hover:text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              disabled={isDemoActionRunning}
              aria-pressed={autoPlay}
              className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                autoPlay
                  ? 'bg-status-amber text-black'
                  : 'bg-surface-light border border-border text-gray-300 hover:text-white'
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" /> : <Play className="w-3.5 h-3.5 text-status-green" aria-hidden="true" />}
              {autoPlay ? 'Pause Auto' : 'Auto Play'}
            </button>

            <button
              type="button"
              onClick={handleNextDemoStep}
              disabled={isDemoActionRunning}
              className="bg-primary text-black hover:bg-primary-dark text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded flex items-center gap-1 shadow shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isDemoActionRunning ? 'Running...' : 'Next Step'} <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

        </header>

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
            <Settings
              onResetDemo={handleResetDemo}
              largeText={largeText}
              setLargeText={setLargeText}
              highContrast={highContrast}
              setHighContrast={setHighContrast}
              reducedMotion={reducedMotion}
              setReducedMotion={setReducedMotion}
              soundAlerts={soundAlerts}
              setSoundAlerts={setSoundAlerts}
            />
          )}
        </div>

      </main>

      {/* Emergency Modal Dialog */}
      {showEmergencyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-sans"
        >
          <div className="bg-surface border-2 border-status-red max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h2 id="emergency-dialog-title" className="text-lg font-bold text-status-red uppercase flex items-center gap-2">
              <Flame className="w-5.5 h-5.5 text-status-red animate-pulse" aria-hidden="true" /> Confirm Emergency Dispatch
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="emergency-cat" className="text-[10px] text-gray-400 font-mono uppercase block font-semibold">Incident Category</label>
                <select
                  id="emergency-cat"
                  value={emergencyCategory}
                  onChange={(e) => setEmergencyCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2 text-xs text-white"
                >
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Fire / Smoke">Fire / Smoke</option>
                  <option value="Crowd Crush / Dangerous Congestion">Crowd Crush / Dangerous Congestion</option>
                  <option value="Security Threat">Security Threat</option>
                  <option value="Technical / Infrastructure Failure">Technical / Infrastructure Failure</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="emergency-loc" className="text-[10px] text-gray-400 font-mono uppercase block font-semibold">Location / Zone</label>
                <select
                  id="emergency-loc"
                  value={emergencyLocation}
                  onChange={(e) => setEmergencyLocation(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2 text-xs text-white"
                >
                  <option value="West Stand">West Stand</option>
                  <option value="East Stand">East Stand</option>
                  <option value="North Stand">North Stand</option>
                  <option value="South Stand">South Stand</option>
                  <option value="Entry Gate A">Entry Gate A</option>
                  <option value="Entry Gate B">Entry Gate B</option>
                  <option value="Food Court">Food Court</option>
                  <option value="Concourse Level 1">Concourse Level 1</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="emergency-desc" className="text-[10px] text-gray-400 font-mono uppercase block font-semibold">Situation Summary</label>
                <textarea
                  id="emergency-desc"
                  placeholder="Provide immediate visual description..."
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2 text-xs text-white h-20 resize-none outline-none focus:border-status-red"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-1/2 min-h-11 bg-surface-light border border-border text-gray-300 hover:text-white font-bold uppercase text-xs rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!emergencyDescription.trim()) {
                    alert('Please enter a description of the emergency.');
                    return;
                  }
                  setIsReportingEmergency(true);
                  try {
                    let type: Incident['type'] = 'Medical';
                    if (emergencyCategory.includes('Fire')) type = 'Equipment';
                    else if (emergencyCategory.includes('Crowd')) type = 'Crowd';
                    else if (emergencyCategory.includes('Security')) type = 'Security';
                    else if (emergencyCategory.includes('Technical')) type = 'Infrastructure';

                    await handleReportIncident({
                      type,
                      location: emergencyLocation,
                      description: `${emergencyCategory}: ${emergencyDescription}`,
                      priority: 'Critical'
                    });

                    playAlertSound();
                    setShowEmergencyModal(false);
                    setEmergencyDescription('');
                    setStatusMessage(`Emergency reported: ${emergencyCategory} at ${emergencyLocation}.`);
                  } finally {
                    setIsReportingEmergency(false);
                  }
                }}
                disabled={isReportingEmergency}
                className="w-1/2 min-h-11 bg-status-red text-white hover:bg-status-red/80 font-bold uppercase text-xs rounded transition-colors disabled:opacity-50"
              >
                {isReportingEmergency ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
