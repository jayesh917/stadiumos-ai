import React, { useState } from 'react';
import { Match } from '../types';
import { Play, Square, Award, Clock, Users, ShieldAlert, AlertOctagon, Loader2, Activity } from 'lucide-react';

interface LiveOperationsProps {
  matches: Match[];
  onStartMatch: (matchId: string) => Promise<void>;
  onEndMatch: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  onAddDelay: (matchId: string, delayMinutes: number, reason: string) => Promise<void>;
}

export const LiveOperations: React.FC<LiveOperationsProps> = ({
  matches,
  onStartMatch,
  onEndMatch,
  onAddDelay
}) => {
  const [delayModalMatch, setDelayModalMatch] = useState<Match | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [delayReason, setDelayReason] = useState('Inclement Weather');

  const [endModalMatch, setEndModalMatch] = useState<Match | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const [loading, setLoading] = useState<string | null>(null);

  const handleStart = async (id: string) => {
    setLoading(id);
    try {
      await onStartMatch(id);
    } finally {
      setLoading(null);
    }
  };

  const handleEndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endModalMatch) return;
    setLoading(endModalMatch.id);
    try {
      await onEndMatch(endModalMatch.id, scoreA, scoreB);
      setEndModalMatch(null);
    } finally {
      setLoading(null);
    }
  };

  const handleDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayModalMatch) return;
    setLoading(delayModalMatch.id);
    try {
      await onAddDelay(delayModalMatch.id, delayMinutes, delayReason);
      setDelayModalMatch(null);
    } finally {
      setLoading(null);
    }
  };

  // Group matches by status
  const liveMatches = matches.filter(m => m.status === 'Live');
  const delayedMatches = matches.filter(m => m.status === 'Delayed');
  const scheduledMatches = matches.filter(m => m.status === 'Scheduled');
  const completedMatches = matches.filter(m => m.status === 'Completed');

  const renderMatchCard = (m: Match) => {
    const isWorking = loading === m.id;
    return (
      <div
        key={m.id}
        className={`bg-surface border p-4.5 rounded-xl flex flex-col justify-between space-y-4 hover:border-primary/30 transition-all ${
          m.status === 'Live' ? 'border-status-blue/40 shadow-md shadow-status-blue/5' :
          m.status === 'Delayed' ? 'border-status-amber/40 shadow-md shadow-status-amber/5' :
          'border-border'
        }`}
      >
        {/* Header telemetry info */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-wider pb-2 border-b border-border/40">
          <span>MATCH {m.id} â€¢ ROUND {m.round}</span>
          <span className="text-gray-400">{m.venue.name}</span>
        </div>

        {/* Score & Team Names display */}
        <div className="flex justify-between items-center px-2 py-1">
          <div className="text-center w-[40%]">
            <h4 className="text-xs font-bold text-white uppercase truncate">{m.team_a.name}</h4>
            <span className="text-[10px] text-gray-500 font-mono">{m.team_a.short_name}</span>
          </div>

          <div className="bg-background/80 border border-border px-3 py-1.5 rounded-lg flex items-center justify-center gap-3">
            {m.status === 'Live' || m.status === 'Completed' ? (
              <span className="text-base font-extrabold text-white font-mono">{m.score_a} - {m.score_b}</span>
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">VS</span>
            )}
          </div>

          <div className="text-center w-[40%]">
            <h4 className="text-xs font-bold text-white uppercase truncate">{m.team_b.name}</h4>
            <span className="text-[10px] text-gray-500 font-mono">{m.team_b.short_name}</span>
          </div>
        </div>

        {/* Dynamic status widgets */}
        <div className="grid grid-cols-2 gap-2 text-[10px] bg-background/30 p-2 rounded-lg border border-border/40 font-mono text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>
              {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>{m.attendance ? `${m.attendance.toLocaleString()} fans` : 'No gate data'}</span>
          </div>
          {m.delay_minutes > 0 && (
            <div className="col-span-2 flex items-center gap-1.5 text-status-amber text-[9px] font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DELAYED BY {m.delay_minutes}M: {m.delay_reason}</span>
            </div>
          )}
        </div>

        {/* Interactive operation buttons */}
        <div className="flex gap-2 pt-1 border-t border-border/40">
          {m.status === 'Scheduled' && (
            <button
              onClick={() => handleStart(m.id)}
              disabled={isWorking}
              className="flex-grow bg-primary hover:bg-primary-dark text-black text-[10px] font-extrabold uppercase py-2 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Start Match
            </button>
          )}

          {m.status === 'Live' && (
            <button
              onClick={() => {
                setScoreA(m.score_a);
                setScoreB(m.score_b);
                setEndModalMatch(m);
              }}
              disabled={isWorking}
              className="flex-grow bg-status-green hover:bg-status-green/80 text-black text-[10px] font-extrabold uppercase py-2 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
              Record Score / End
            </button>
          )}

          {m.status !== 'Completed' && (
            <button
              onClick={() => setDelayModalMatch(m)}
              disabled={isWorking}
              className="border border-status-amber/40 hover:bg-status-amber/10 text-status-amber text-[10px] font-bold uppercase px-3 py-2 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Delay
            </button>
          )}

          {m.status === 'Completed' && (
            <div className="flex-grow text-center text-[10px] font-extrabold text-status-green tracking-wider uppercase border border-status-green/20 bg-status-green/5 py-2 rounded">
              MATCH COMPLETED
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans" id="live-operations-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <Activity className="w-5.5 h-5.5 text-primary" /> Live Match Control Dashboard
          </h2>
          <p className="text-xs text-gray-400 font-medium">Coordinate ongoing match timelines, record final scorelines, and submit schedule exceptions.</p>
        </div>
      </div>

      {/* Grid columns of different match scopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Column 1: Live & Delayed matches */}
        <div className="space-y-4 bg-surface/30 p-4.5 border border-border/80 rounded-xl min-h-[400px]">
          <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-border/60 pb-2 flex items-center justify-between">
            <span>LIVE & DELAYED FIXTURES</span>
            <span className="text-[9px] font-mono text-gray-500">({liveMatches.length + delayedMatches.length})</span>
          </h3>
          <div className="space-y-4">
            {liveMatches.map(renderMatchCard)}
            {delayedMatches.map(renderMatchCard)}
            {liveMatches.length === 0 && delayedMatches.length === 0 && (
              <p className="text-[10px] text-gray-500 italic py-12 text-center">No active or delayed fixtures.</p>
            )}
          </div>
        </div>

        {/* Column 2: Scheduled matches */}
        <div className="space-y-4 bg-surface/30 p-4.5 border border-border/80 rounded-xl min-h-[400px]">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase border-b border-border/60 pb-2 flex items-center justify-between">
            <span>UPCOMING SCHEDULED</span>
            <span className="text-[9px] font-mono text-gray-500">({scheduledMatches.length})</span>
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {scheduledMatches.map(renderMatchCard)}
            {scheduledMatches.length === 0 && (
              <p className="text-[10px] text-gray-500 italic py-12 text-center">No upcoming fixtures.</p>
            )}
          </div>
        </div>

        {/* Column 3: Completed matches */}
        <div className="space-y-4 bg-surface/30 p-4.5 border border-border/80 rounded-xl min-h-[400px]">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase border-b border-border/60 pb-2 flex items-center justify-between">
            <span>COMPLETED GAMES</span>
            <span className="text-[9px] font-mono text-gray-500">({completedMatches.length})</span>
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {completedMatches.map(renderMatchCard)}
            {completedMatches.length === 0 && (
              <p className="text-[10px] text-gray-500 italic py-12 text-center">No games finished yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* DELAY MODAL POPUP */}
      {delayModalMatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-md space-y-4 relative animate-scaleUp">
            <h3 className="text-sm font-bold text-white uppercase border-b border-border pb-2 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-status-amber" /> Trigger Match Delay : Match {delayModalMatch.id}
            </h3>

            <form onSubmit={handleDelaySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Select Delay Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDelayMinutes(mins)}
                      className={`py-2 text-xs font-bold rounded border ${
                        delayMinutes === mins
                          ? 'bg-status-amber text-black border-status-amber'
                          : 'bg-background border-border text-gray-400 hover:text-white'
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Reason for Delay Exception</label>
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none cursor-pointer focus:border-primary"
                >
                  <option value="Inclement Weather">Inclement Weather / Severe Rain</option>
                  <option value="Crowd Security Holding">Spectator Scanning Gate Congestion</option>
                  <option value="Medical Emergency Intervention">On-field Medical Intervention</option>
                  <option value="Infrastructure Power Failure">Floodlight / AV System Issue</option>
                </select>
              </div>

              <div className="bg-background/60 p-3 rounded text-[10px] text-gray-400 leading-relaxed border border-border">
                <strong className="text-status-amber uppercase font-mono tracking-wider block mb-1">Downstream Schedule Impact Warning:</strong>
                Submitting this delay shifts Match {delayModalMatch.id} start times, which will immediately alert spectator notification networks, degrade schedule alignment score, and seed an AI Rescheduling recommendation.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDelayModalMatch(null)}
                  className="bg-surface-light border border-border hover:bg-border/30 hover:text-white text-gray-400 text-[10px] font-extrabold uppercase px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-status-amber text-black hover:bg-status-amber/80 text-[10px] font-extrabold uppercase px-4 py-2 rounded transition-colors"
                >
                  Confirm Delay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END MATCH / RECORD SCORE MODAL POPUP */}
      {endModalMatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-md space-y-4 relative animate-scaleUp">
            <h3 className="text-sm font-bold text-white uppercase border-b border-border pb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-status-green" /> Record Final Score : Match {endModalMatch.id}
            </h3>

            <form onSubmit={handleEndSubmit} className="space-y-4">
              <div className="flex justify-between items-center gap-4 bg-background/50 p-4 rounded-lg border border-border">
                <div className="text-center w-[40%] space-y-1">
                  <span className="text-[10px] font-bold text-white uppercase block truncate">{endModalMatch.team_a.name}</span>
                  <input
                    type="number"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                    className="w-16 bg-background border border-border text-center text-lg font-bold p-1 rounded text-white outline-none focus:border-primary"
                    min={0}
                    required
                  />
                </div>
                <span className="text-xs text-gray-500 font-bold uppercase font-mono">VS</span>
                <div className="text-center w-[40%] space-y-1">
                  <span className="text-[10px] font-bold text-white uppercase block truncate">{endModalMatch.team_b.name}</span>
                  <input
                    type="number"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                    className="w-16 bg-background border border-border text-center text-lg font-bold p-1 rounded text-white outline-none focus:border-primary"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEndModalMatch(null)}
                  className="bg-surface-light border border-border hover:bg-border/30 hover:text-white text-gray-400 text-[10px] font-extrabold uppercase px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-status-green text-black hover:bg-status-green/80 text-[10px] font-extrabold uppercase px-4 py-2 rounded transition-colors"
                >
                  Complete Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
