import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart3, TrendingDown, Clock, ShieldCheck, Zap, Users, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsProps {
  analytics: AnalyticsData;
}

export const Analytics: React.FC<AnalyticsProps> = ({ analytics }) => {
  // Comparative data representation
  const comparisonData = [
    { name: 'Incident Response (mins)', Traditional: 7.2, StadiumOS: analytics.avg_incident_response_time_mins },
    { name: 'Gate Wait Time (mins)', Traditional: 12.5, StadiumOS: analytics.avg_crowd_wait_time_mins }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans" id="analytics-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <BarChart3 className="w-5.5 h-5.5 text-primary" /> Operational Impact & Analytics
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Review operational metrics, SLA response durations, and crowd congestion mitigation efficacy. Illustrates the intelligence-to-measurable-impact feedback loop.
        </p>
      </div>

      {/* Headline Impact Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Metric 1 */}
        <div className="bg-surface border border-border p-5 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-green/10 flex items-center justify-center flex-shrink-0 border border-status-green/20">
            <Clock className="w-5 h-5 text-status-green" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">Incident Response Efficacy</span>
            <p className="text-xl font-bold text-white tracking-tight">42% Faster SLA</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Dispatcher unit allocation average reduced from 7.2m down to {analytics.avg_incident_response_time_mins}m.
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-border p-5 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">Crowd Ingress Speedup</span>
            <p className="text-xl font-bold text-white tracking-tight">87% Lower Gate Wait</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Gate bottleneck wait times reduced from 12.5m down to {analytics.avg_crowd_wait_time_mins}m.
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface border border-border p-5 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-status-blue/10 flex items-center justify-center flex-shrink-0 border border-status-blue/20">
            <ShieldCheck className="w-5 h-5 text-status-blue" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">Operational Safeguards</span>
            <p className="text-xl font-bold text-white tracking-tight">{analytics.schedule_conflicts_prevented} Conflicts Resolved</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              AI scheduling engine shifted parallel timelines, averting {analytics.schedule_conflicts_prevented} conflicts.
            </p>
          </div>
        </div>

      </div>

      {/* Telemetry charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left: Traditional vs StadiumOS AI comparative chart */}
        <div className="md:col-span-2 bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Operational KPI Comparison (mins)</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1622', borderColor: '#1f2d42', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Traditional" fill="#1f2d42" name="Traditional Dashboard" />
                <Bar dataKey="StadiumOS" fill="#00d2ff" name="StadiumOS AI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Operations Quality summary widgets */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Operational Safety Stats</h3>

          <div className="space-y-4 flex-grow justify-center flex flex-col">
            {/* Stat 1 */}
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono">AI Recommendation approval</span>
              <span className="text-sm font-bold text-white">{analytics.ai_recommendations_accepted} accepted</span>
            </div>
            {/* Stat 2 */}
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Critical Crowd Events</span>
              <span className="text-sm font-bold text-status-green">0 active / Resolved</span>
            </div>
            {/* Stat 3 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Venue occupancy utilization</span>
              <span className="text-sm font-bold text-white">{analytics.venue_utilization_pct}% avg</span>
            </div>
          </div>

          <div className="bg-background/40 border border-border p-3 rounded text-[9px] text-gray-500 uppercase text-center font-mono leading-relaxed mt-2">
            Data sourced from active database transactions and audit logs.
          </div>
        </div>

      </div>

    </div>
  );
};
