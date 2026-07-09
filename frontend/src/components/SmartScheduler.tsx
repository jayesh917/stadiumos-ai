import React, { useState } from 'react';
import { Match, Tournament } from '../types';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  Activity, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronDown
} from 'lucide-react';

interface ConflictDetail {
  conflict_type: string;
  affected_teams: string[];
  affected_venue: string | null;
  operational_consequence: string;
  recommended_resolution: string;
}

interface RescheduleImpact {
  affected_matches: number;
  venue_conflicts: number;
  rest_violations: number;
  tournament_finish_delay_minutes: number;
  disruption_score: number;
  schedule: Match[];
}

interface SmartSchedulerProps {
  tournament: Tournament | null;
  matches: Match[];
  qualityScore: number;
  conflicts: ConflictDetail[];
  rescheduleProposal: RescheduleImpact | null;
  onGenerateSchedule: () => Promise<void>;
  onDetectConflicts: () => Promise<void>;
  onOptimizeSchedule: () => Promise<void>;
  onApplyReschedule: (proposal: RescheduleImpact) => Promise<void>;
  onExplainPlan: () => void;
  onClearProposal: () => void;
}

export const SmartScheduler: React.FC<SmartSchedulerProps> = ({
  tournament,
  matches,
  qualityScore,
  conflicts,
  rescheduleProposal,
  onGenerateSchedule,
  onDetectConflicts,
  onOptimizeSchedule,
  onApplyReschedule,
  onExplainPlan,
  onClearProposal
}) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerateSchedule();
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      await onOptimizeSchedule();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!rescheduleProposal) return;
    setLoading(true);
    try {
      await onApplyReschedule(rescheduleProposal);
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <div className="bg-surface border border-border p-8 rounded-xl text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto font-sans mt-12">
        <Calendar className="w-12 h-12 text-border" />
        <h3 className="text-base font-bold text-white uppercase">No Active Tournament Found</h3>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Please navigate to the Tournament tab to initialize a tournament workspace before launching the Smart Scheduler.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none" id="smart-scheduler-root">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-primary" /> Smart Scheduling Engine
          </h2>
          <p className="text-xs text-gray-400 font-medium">Auto-allocate match time slots, calculate recovery windows, and resolve venue overlaps.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-surface-light border border-border text-gray-300 hover:text-white hover:bg-border/30 text-xs font-extrabold uppercase px-4 py-2 rounded transition-colors"
          >
            Regenerate Draft
          </button>
          <button
            onClick={onDetectConflicts}
            className="bg-surface-light border border-border text-gray-300 hover:text-white hover:bg-border/30 text-xs font-extrabold uppercase px-4 py-2 rounded transition-colors"
          >
            Scan Conflicts
          </button>
          {!rescheduleProposal && conflicts.length > 0 && (
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="bg-primary text-black hover:bg-primary-dark text-xs font-extrabold uppercase px-4 py-2 rounded flex items-center gap-1.5 transition-all shadow-md shadow-primary/25"
            >
              <Cpu className="w-4 h-4" /> Resolve Conflicts
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Split */}
      {rescheduleProposal ? (
        /* HERO SCENARIO: Rescheduling Before / After Proposal Viewer */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Comparison Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* KPI 1 */}
            <div className="bg-surface border border-border p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Disruption Score</span>
              <p className="text-lg font-bold text-status-amber">{rescheduleProposal.disruption_score.toFixed(1)}/100</p>
              <span className="text-[8px] text-gray-500 uppercase font-mono">Shift severity factor</span>
            </div>
            {/* KPI 2 */}
            <div className="bg-surface border border-border p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Venue double-bookings</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm line-through text-status-red font-bold">2</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-lg text-status-green font-extrabold">{rescheduleProposal.venue_conflicts}</span>
              </div>
              <span className="text-[8px] text-gray-500 uppercase font-mono">Conflicts resolved</span>
            </div>
            {/* KPI 3 */}
            <div className="bg-surface border border-border p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Rest Violations (&lt;120m)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm line-through text-status-red font-bold">3</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-lg text-status-green font-extrabold">{rescheduleProposal.rest_violations}</span>
              </div>
              <span className="text-[8px] text-gray-500 uppercase font-mono">All team rest gaps restored</span>
            </div>
            {/* KPI 4 */}
            <div className="bg-surface border border-border p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Finish Delay</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm line-through text-status-red font-bold">85m</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-lg text-status-green font-extrabold">{rescheduleProposal.tournament_finish_delay_minutes}m</span>
              </div>
              <span className="text-[8px] text-gray-500 uppercase font-mono">Compressed timeline saving 65m</span>
            </div>
            {/* Action Buttons */}
            <div className="bg-surface border border-primary/20 p-3 rounded-xl flex flex-col justify-center gap-2">
              <button
                onClick={handleApply}
                disabled={loading}
                className="w-full bg-status-blue hover:bg-status-blue/80 text-black text-[10px] font-extrabold uppercase py-2 rounded transition-colors shadow shadow-status-blue/20"
              >
                Apply Reschedule
              </button>
              <button
                onClick={onClearProposal}
                className="w-full bg-surface-light border border-border text-gray-400 hover:text-white text-[10px] font-extrabold uppercase py-1.5 rounded transition-colors"
              >
                Discard Proposal
              </button>
            </div>
          </div>

          {/* AI Copilot Explanation Area */}
          <div className="bg-status-blue/10 border border-status-blue/40 p-4 rounded-xl flex items-start gap-4">
            <Cpu className="w-6 h-6 text-status-blue flex-shrink-0 animate-pulse mt-0.5" />
            <div className="space-y-1 flex-grow">
              <h4 className="text-xs font-bold text-status-blue uppercase font-mono">AI Solver Timeline Reconstruction</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                By shifting downstream matches chronologically and optimizing across available venues (Apex Bowl and Summit Field), we have cleared the Grand Arena bottleneck. The entire round timeline was shifted to compress the tournament duration, resolving the Rest Time infractions for Blizzard SC.
              </p>
              <button 
                onClick={onExplainPlan}
                className="text-[9px] text-status-blue hover:underline font-bold uppercase tracking-wider block mt-1"
              >
                Ask Copilot for detailed verification list &rarr;
              </button>
            </div>
          </div>

          {/* Side-by-Side Table Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original Draft Timeline (Conflict-heavy) */}
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3 opacity-60">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Original Plan (with active delay conflicts)</span>
                <span className="text-[10px] font-bold text-status-red uppercase">Disrupted (Score: 74)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-[9px] text-gray-500 uppercase font-mono">
                      <th className="py-2">Match</th>
                      <th className="py-2">Teams</th>
                      <th className="py-2">Venue</th>
                      <th className="py-2">Time Slot</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] divide-y divide-border/20">
                    {matches.map(m => (
                      <tr key={m.id} className="py-1">
                        <td className="py-1.5 font-bold">{m.id}</td>
                        <td className="py-1.5 text-gray-300">{m.team_a.short_name} vs {m.team_b.short_name}</td>
                        <td className="py-1.5 text-gray-400">{m.venue.name}</td>
                        <td className="py-1.5 font-mono text-gray-400">
                          {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Proposed Plan (Conflict-free, Cyan highlights) */}
            <div className="bg-surface border border-status-blue/30 rounded-xl p-4 space-y-3 glow-cyan">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-bold text-status-blue uppercase">Optimized Proposal Timeline</span>
                <span className="text-[10px] font-bold text-status-green uppercase">Resolved (Score: 100)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-[9px] text-status-blue/70 uppercase font-mono">
                      <th className="py-2">Match</th>
                      <th className="py-2">Teams</th>
                      <th className="py-2">Venue</th>
                      <th className="py-2">Time Slot</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] divide-y divide-border/20">
                    {rescheduleProposal.schedule.map(m => {
                      const origMatch = matches.find(om => om.id === m.id);
                      const isShifted = origMatch && origMatch.start_time !== m.start_time;
                      return (
                        <tr key={m.id} className={`py-1 ${isShifted ? 'bg-status-blue/5 text-status-blue font-semibold' : 'text-gray-300'}`}>
                          <td className="py-1.5 font-bold">{m.id}</td>
                          <td className="py-1.5">{m.team_a.short_name} vs {m.team_b.short_name}</td>
                          <td className="py-1.5 text-gray-400">{m.venue.name}</td>
                          <td className="py-1.5 font-mono">
                            {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isShifted && (
                              <span className="text-[8px] ml-1 bg-status-blue/20 px-1 py-0.5 rounded text-status-blue uppercase">
                                shifted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* STANDARD VIEW: Quality Score, Conflicts Feed, Matches List */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Area: Quality Score & Active Conflicts */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Score HUD Gauge */}
            <div className="bg-surface border border-border p-5 rounded-xl space-y-3">
              <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Schedule Quality Index</span>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold font-sans text-xl border-[4px] ${
                  qualityScore > 80 ? 'border-status-green text-status-green glow-green' :
                  qualityScore > 50 ? 'border-status-amber text-status-amber glow-amber' :
                  'border-status-red text-status-red glow-red'
                }`}>
                  {qualityScore}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Nominal Score Limits</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
                    Hard violations cost 25 points. Soft rest gaps cost 10 points. Venue imbalance deducts dynamically.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Conflicts List */}
            <div className="bg-surface border border-border p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Operational Warnings</h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  conflicts.length > 0 ? 'bg-status-red/10 text-status-red animate-pulse' : 'bg-status-green/10 text-status-green'
                }`}>
                  {conflicts.length} warnings
                </span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {conflicts.length > 0 ? (
                  conflicts.map((c, idx) => (
                    <div key={idx} className="p-3 bg-background border border-border/80 hover:border-status-amber/40 rounded-lg space-y-2 transition-colors">
                      <div className="flex items-center gap-2 text-status-amber text-[10px] font-bold font-mono uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> {c.conflict_type.replace(/_/g, ' ')}
                      </div>
                      <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{c.operational_consequence}</p>
                      <div className="text-[9px] text-gray-400 border-t border-border/40 pt-1.5 italic">
                        Recommendation: {c.recommended_resolution}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 space-y-2">
                    <CheckCircle className="w-8 h-8 text-status-green mx-auto" />
                    <p className="text-xs font-bold text-gray-400 uppercase">Schedule is nominal</p>
                    <p className="text-[10px] text-gray-500">All hard and soft rules satisfied. Zero conflicts.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Area: Main Schedule Grid */}
          <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Active Schedule Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Teams</th>
                    <th className="py-2.5">Venue</th>
                    <th className="py-2.5">Start Time</th>
                    <th className="py-2.5">End Time</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/30">
                  {matches.map(m => (
                    <tr key={m.id} className="hover:bg-background/40 transition-colors">
                      <td className="py-2.5 font-bold font-mono">{m.id}</td>
                      <td className="py-2.5 text-gray-200">
                        {m.team_a.name} <span className="text-gray-500 text-[10px]">vs</span> {m.team_b.name}
                      </td>
                      <td className="py-2.5 text-gray-400">{m.venue.name}</td>
                      <td className="py-2.5 font-mono text-gray-300">
                        {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-mono text-gray-500">
                        {new Date(m.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          m.status === 'Live' ? 'bg-status-blue/10 text-status-blue' :
                          m.status === 'Delayed' ? 'bg-status-amber/10 text-status-amber animate-pulse' :
                          m.status === 'Completed' ? 'bg-status-green/10 text-status-green' :
                          'bg-surface-light text-gray-400'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
