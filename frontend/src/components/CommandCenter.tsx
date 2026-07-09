import React from 'react';
import { CrowdZone, Incident, OperationalEvent, Alert, AIRecommendation, AnalyticsData, Match } from '../types';
import { StadiumMap } from './StadiumMap';
import {
  Users,
  AlertTriangle,
  Clock,
  Activity,
  HelpCircle,
  Cpu,
  ChevronRight,
  UserPlus,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CommandCenterProps {
  zones: CrowdZone[];
  incidents: Incident[];
  events: OperationalEvent[];
  alerts: Alert[];
  recs: AIRecommendation[];
  analytics: AnalyticsData;
  matches: Match[];
  onApplyCrowdAction: (recId: number) => void;
  onNavigateToTab: (tab: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  zones,
  incidents,
  events,
  alerts,
  recs,
  analytics,
  matches,
  onApplyCrowdAction,
  onNavigateToTab
}) => {
  const [selectedZone, setSelectedZone] = React.useState<CrowdZone | null>(null);

  // Derive Global Operational Status
  const getGlobalStatus = () => {
    const hasCriticalIncident = incidents.some(i => i.priority === 'Critical' && i.status !== 'RESOLVED');
    const hasCriticalZone = zones.some(z => z.status === 'CRITICAL');
    const hasActiveAlerts = alerts.some(a => a.severity === 'Critical' && !a.resolved);

    if (hasCriticalIncident || hasCriticalZone || hasActiveAlerts) {
      return { label: 'CRITICAL OPERATIONS RISK', color: 'bg-status-red text-white border-status-red pulse-red' };
    }

    const hasHighIncident = incidents.some(i => i.priority === 'High' && i.status !== 'RESOLVED');
    const hasHighZone = zones.some(z => z.status === 'HIGH');

    if (hasHighIncident || hasHighZone) {
      return { label: 'ELEVATED OPERATIONS RISK', color: 'bg-status-amber text-black border-status-amber glow-amber' };
    }

    return { label: 'SYSTEM NOMINAL', color: 'bg-status-green/20 text-status-green border-status-green glow-green' };
  };

  const globalStatus = getGlobalStatus();

  // Active Matches
  const activeMatches = matches.filter(m => m.status === 'Live');
  const delayedMatches = matches.filter(m => m.status === 'Delayed');

  // Total occupancy calculation
  const stands = zones.filter(z => z.id.includes('stand'));
  const totalOccupancy = stands.reduce((sum, z) => sum + z.current_occupancy, 0);
  const totalCapacity = stands.reduce((sum, z) => sum + z.capacity, 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const openIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
  const criticalIncidents = openIncidents.filter(i => i.priority === 'Critical');

  // Chart data: Zone occupancy comparison
  const zoneChartData = zones.map(z => ({
    name: z.name.replace(' Stand', '').replace('Entry ', ''),
    occupancy: z.current_occupancy,
    capacity: z.capacity,
    ratio: Math.round(z.occupancy_ratio * 100)
  }));

  // Find if there is an active crowd recommendation for the selected zone
  const activeZoneRec = selectedZone
    ? recs.find(r => r.scenario_type === 'crowd' && r.status === 'Pending' && r.evidence.some(e => e.includes(selectedZone.name)))
    : null;

  return (
    <div className="space-y-6 font-sans" id="command-center-root">

      {/* Top Banner Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">Command Center Telemetry</h2>
          <p className="text-xs text-gray-400 font-medium">Real-time stadium crowd density, incident response, and scheduling oversight.</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-xs font-extrabold tracking-widest uppercase transition-all duration-500 ${globalStatus.color}`}>
          {globalStatus.label}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col justify-between h-[100px] hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Live Matches / Delayed</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white tracking-tight">{activeMatches.length}</span>
            <span className="text-xs text-gray-500">/</span>
            <span className={`text-sm font-bold ${delayedMatches.length > 0 ? 'text-status-red' : 'text-gray-400'}`}>
              {delayedMatches.length} delayed
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col justify-between h-[100px] hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Stadium Occupancy</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white tracking-tight">{occupancyPct}%</span>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider font-semibold uppercase">
              ({totalOccupancy.toLocaleString()} pax)
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col justify-between h-[100px] hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Open Incidents / Critical</span>
            <AlertTriangle className={`w-4 h-4 ${criticalIncidents.length > 0 ? 'text-status-red animate-bounce' : 'text-status-amber'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white tracking-tight">{openIncidents.length}</span>
            <span className="text-xs text-gray-500">/</span>
            <span className={`text-sm font-bold ${criticalIncidents.length > 0 ? 'text-status-red animate-pulse' : 'text-gray-400'}`}>
              {criticalIncidents.length} critical
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col justify-between h-[100px] hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">AI Disruption score</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold tracking-tight ${
              analytics.schedule_disruption_score > 60 ? 'text-status-red' :
              analytics.schedule_disruption_score > 30 ? 'text-status-amber' :
              'text-status-green'
            }`}>
              {analytics.schedule_disruption_score}/100
            </span>
            <span className="text-[9px] text-gray-500 uppercase font-mono">
              {recs.filter(r => r.status === 'Pending').length} pending actions
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Details Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Side: Map and Charts */}
        <div className="xl:col-span-2 space-y-6">

          {/* Interactive Stadium Map Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-primary font-mono uppercase">Live Stadium Zone Telemetry</h3>
              <p className="text-[10px] text-gray-500">Click stand or gate to open details</p>
            </div>
            <StadiumMap
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
            />
          </div>

          {/* Zone Occupancy Breakdowns Chart */}
          <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Occupancy Telemetry Comparison (%)</h3>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1622', borderColor: '#1f2d42', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#00d2ff', fontSize: '10px' }}
                  />
                  <Bar
                    dataKey="ratio"
                    fill="#0099ff"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side: Zone Details / Recommendations Drawer */}
        <div className="space-y-6">

          {/* Zone Detail Panel */}
          <div className="bg-surface border border-border p-5 rounded-xl min-h-[300px] flex flex-col justify-between">
            {selectedZone ? (
              <div className="space-y-4 flex-grow">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">{selectedZone.name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest">ZONE ID: {selectedZone.id.toUpperCase()}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    selectedZone.status === 'CRITICAL' ? 'bg-status-red/20 text-status-red border border-status-red/40' :
                    selectedZone.status === 'HIGH' ? 'bg-status-amber/20 text-status-amber border border-status-amber/40' :
                    selectedZone.status === 'WATCH' ? 'bg-status-amber/10 text-status-amber/80' :
                    'bg-status-green/10 text-status-green'
                  }`}>
                    {selectedZone.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-background/40 p-2.5 rounded border border-border/40">
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide uppercase">Occupancy Ratio</span>
                    <p className="text-sm font-bold text-white mt-0.5">{Math.round(selectedZone.occupancy_ratio * 100)}%</p>
                    <span className="text-[8px] text-gray-500 font-mono uppercase">({selectedZone.current_occupancy.toLocaleString()} / {selectedZone.capacity.toLocaleString()} max)</span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded border border-border/40">
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide uppercase">Entry Flow Rate</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedZone.entry_rate} scans/m</p>
                    <span className="text-[8px] text-gray-500 font-mono uppercase">Exit: {selectedZone.exit_rate} scans/m</span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded border border-border/40">
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide uppercase">Queue Size</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedZone.queue_length} people</p>
                    <span className="text-[8px] text-gray-500 font-mono uppercase">Wait time: {Math.round((selectedZone.queue_length * 8) / 60)} min</span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded border border-border/40">
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide uppercase">Congestion Trend</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className={`w-3.5 h-3.5 ${selectedZone.congestion_trend > 0 ? 'text-status-red' : 'text-status-green'}`} />
                      <p className={`text-xs font-bold ${selectedZone.congestion_trend > 0 ? 'text-status-red' : 'text-status-green'}`}>
                        {selectedZone.congestion_trend > 0 ? `+${Math.round(selectedZone.congestion_trend * 100)}% Influx` : `${Math.round(selectedZone.congestion_trend * 100)}% Outflow`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation in Zone Detail Panel if any */}
                {activeZoneRec ? (
                  <div className="bg-status-blue/10 border border-status-blue/40 p-3 rounded-lg mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-status-blue font-bold text-[10px] tracking-wider uppercase font-mono">
                      <Cpu className="w-3.5 h-3.5 animate-pulse" /> AI Operations Copilot Advice
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{activeZoneRec.summary}</p>
                    <div className="pt-1.5 flex gap-2">
                      <button
                        onClick={() => onApplyCrowdAction(activeZoneRec.id)}
                        className="bg-status-blue text-black hover:bg-status-blue/80 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded transition-colors"
                      >
                        Approve Action Plan
                      </button>
                      <button
                        onClick={() => onNavigateToTab('ai-copilot')}
                        className="border border-status-blue/40 hover:bg-status-blue/10 text-status-blue text-[9px] font-extrabold uppercase px-2 py-1 rounded transition-colors"
                      >
                        Explain
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 italic mt-6 border-t border-border/40 pt-4 flex gap-1.5 items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-status-green" /> Zone telemetry is stable. No incident alerts.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-4">
                <HelpCircle className="w-8 h-8 text-border mb-2.5" />
                <h4 className="text-xs font-bold text-gray-400 uppercase font-sans tracking-wide">No Zone Selected</h4>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Click any zone on the stadium grid to view live occupancies and security logs.</p>
              </div>
            )}

            {/* Quick action buttons at bottom of drawer */}
            {selectedZone && (
              <button
                onClick={() => setSelectedZone(null)}
                className="w-full bg-surface-light border border-border text-[9px] text-gray-400 hover:text-white uppercase font-extrabold py-2 mt-4 rounded hover:bg-border/30 transition-colors"
              >
                Close Panel
              </button>
            )}
          </div>

          {/* Active Copilot Recommendations summary */}
          <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-primary font-mono uppercase">Pending Copilot Actions</h3>
              <span className="text-[9px] font-mono text-gray-500">({recs.filter(r => r.status === 'Pending').length})</span>
            </div>
            <div className="space-y-2">
              {recs.filter(r => r.status === 'Pending').length > 0 ? (
                recs.filter(r => r.status === 'Pending').map(r => (
                  <div
                    key={r.id}
                    onClick={() => onNavigateToTab(r.scenario_type === 'schedule' ? 'scheduler' : 'ai-copilot')}
                    className="p-2.5 bg-background/50 hover:bg-background/80 rounded border border-border hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        r.risk_level === 'CRITICAL' ? 'bg-status-red/10 text-status-red' : 'bg-status-amber/10 text-status-amber'
                      }`}>
                        {r.risk_level}
                      </span>
                      <p className="text-[10px] text-gray-300 font-sans line-clamp-1 group-hover:text-white transition-colors">{r.summary}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors ml-2" />
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 italic text-center py-4">No pending AI recommendations.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer Grid: Alerts Feed & Event logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Live Alerts Feed */}
        <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-status-red font-mono uppercase">Priority Alerts (Active)</h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {alerts.filter(a => !a.resolved).length > 0 ? (
              alerts.filter(a => !a.resolved).map(a => (
                <div key={a.id} className="p-3 bg-status-red/10 border border-status-red/30 rounded-lg flex items-start gap-3 pulse-red">
                  <AlertTriangle className="w-4 h-4 text-status-red flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-white uppercase">{a.title}</h4>
                    <p className="text-[10px] text-gray-300 mt-0.5 leading-relaxed">{a.message}</p>
                    <span className="text-[8px] text-gray-500 font-mono mt-1 block">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-500 italic py-6 text-center">No active priority alerts.</p>
            )}
          </div>
        </div>

        {/* Live Event logs Feed */}
        <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-primary font-mono uppercase flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Live Operations Feed
          </h3>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {events.length > 0 ? (
              events.map(e => (
                <div key={e.id} className="text-[10px] border-b border-border/40 pb-2 flex justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${
                      e.severity === 'critical' ? 'text-status-red' :
                      e.severity === 'error' ? 'text-status-red' :
                      e.severity === 'warning' ? 'text-status-amber' :
                      e.severity === 'success' ? 'text-status-green' :
                      'text-primary'
                    }`}>
                      [{e.category.toUpperCase()}] {e.title}
                    </span>
                    <p className="text-gray-400 font-sans leading-relaxed">{e.description}</p>
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono flex-shrink-0 mt-0.5">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-500 italic py-6 text-center">No logs generated yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
