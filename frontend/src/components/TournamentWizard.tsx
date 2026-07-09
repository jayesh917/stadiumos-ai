import React, { useState } from 'react';
import { Tournament } from '../types';
import { Trophy, Calendar, Settings, Play, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface TournamentWizardProps {
  tournament: Tournament | null;
  onLoadDemo: () => Promise<void>;
  onCreateTournament: (data: any) => Promise<void>;
}

export const TournamentWizard: React.FC<TournamentWizardProps> = ({
  tournament,
  onLoadDemo,
  onCreateTournament
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'National Champions Cup 2026',
    sport: 'Soccer',
    format: 'Round Robin',
    num_teams: 16,
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    match_duration: 40,
    min_rest_time: 120,
    operating_hours_start: '08:00',
    operating_hours_end: '22:00'
  });

  const handleLoadDemoClick = async () => {
    setLoading(true);
    try {
      await onLoadDemo();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert date strings to ISO string datetimes
      const start = new Date(formData.start_date).toISOString();
      const end = new Date(formData.end_date).toISOString();
      await onCreateTournament({
        ...formData,
        start_date: start,
        end_date: end
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans select-none">
      
      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <Trophy className="w-5.5 h-5.5 text-primary" /> Tournament Orchestration Wizard
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Configure game parameters, scheduling rest intervals, and venue operational blackout periods. Seed a simulated tournament workspace to begin command center operations.
        </p>
      </div>

      {tournament ? (
        /* Tournament Active Display */
        <div className="bg-surface border border-primary/30 p-6 rounded-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-primary uppercase">ACTIVE TOURNAMENT RECORD</span>
              <h3 className="text-lg font-bold text-white uppercase">{tournament.name}</h3>
              <p className="text-xs text-gray-400">Sport: {tournament.sport} • Format: {tournament.format}</p>
            </div>
            <span className="px-3 py-1 rounded bg-status-green/10 border border-status-green/30 text-status-green text-xs font-extrabold uppercase tracking-wider animate-pulse">
              {tournament.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60">
            <div className="bg-background/40 p-3.5 rounded border border-border">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Teams Count</span>
              <p className="text-base font-bold text-white mt-1">{tournament.num_teams} Teams</p>
            </div>
            <div className="bg-background/40 p-3.5 rounded border border-border">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Rest Gap Buffer</span>
              <p className="text-base font-bold text-white mt-1">{tournament.min_rest_time} Mins</p>
            </div>
            <div className="bg-background/40 p-3.5 rounded border border-border">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Operating Hours</span>
              <p className="text-base font-bold text-white mt-1">{tournament.operating_hours_start} - {tournament.operating_hours_end}</p>
            </div>
            <div className="bg-background/40 p-3.5 rounded border border-border">
              <span className="text-[9px] text-gray-500 font-mono uppercase">Duration Limit</span>
              <p className="text-base font-bold text-white mt-1">{tournament.match_duration} Mins / game</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLoadDemoClick}
              disabled={loading}
              className="bg-surface-light border border-border hover:bg-border/30 hover:text-white text-gray-300 text-xs font-extrabold uppercase px-4 py-2.5 rounded transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
              Reset Demo Tournament Workspace
            </button>
          </div>
        </div>
      ) : (
        /* Tournament Seed Setup Options */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Quick Start Seed Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-surface to-background border border-border p-6 rounded-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white uppercase">One-Click Demo Seed</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Instantly drop database schema, initialize 16 professional teams, 4 venues, 9 crowd zones, and draft conflict-free match schedules.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadDemoClick}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-black font-extrabold uppercase text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Load Demo Tournament <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Custom Creation Form */}
          <div className="md:col-span-3 bg-surface border border-border p-6 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase pb-2 border-b border-border">Custom Tournament Config</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Tournament Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Sport Type</label>
                  <input
                    type="text"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Teams Count</label>
                  <select
                    value={formData.num_teams}
                    onChange={(e) => setFormData({ ...formData, num_teams: parseInt(e.target.value) })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                  >
                    <option value={8}>8 Teams</option>
                    <option value={12}>12 Teams</option>
                    <option value={16}>16 Teams (Seeded default)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Match Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                  >
                    <option value="Round Robin">Round Robin</option>
                    <option value="Single Elimination">Single Elimination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Match duration</label>
                  <input
                    type="number"
                    value={formData.match_duration}
                    onChange={(e) => setFormData({ ...formData, match_duration: parseInt(e.target.value) })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    min={10}
                    max={120}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Rest interval</label>
                  <input
                    type="number"
                    value={formData.min_rest_time}
                    onChange={(e) => setFormData({ ...formData, min_rest_time: parseInt(e.target.value) })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    min={30}
                    max={360}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Start Hour</label>
                  <input
                    type="text"
                    value={formData.operating_hours_start}
                    onChange={(e) => setFormData({ ...formData, operating_hours_start: e.target.value })}
                    className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
                    placeholder="08:00"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-surface-light border border-border hover:bg-primary hover:text-black font-extrabold uppercase text-xs py-2.5 mt-3 rounded transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <>
                    Initialize Custom Workspace <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
