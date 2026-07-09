import React, { useState } from 'react';
import { CrowdZone, AIRecommendation } from '../types';
import {
  Users,
  HelpCircle,
  Activity,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CrowdIntelligenceProps {
  zones: CrowdZone[];
  crowdRecs: AIRecommendation[];
  onTriggerScenario: (scenario: string) => Promise<void>;
  onApplyAction: (recId: number) => Promise<void>;
}

export const CrowdIntelligence: React.FC<CrowdIntelligenceProps> = ({
  zones,
  crowdRecs,
  onTriggerScenario,
  onApplyAction
}) => {
  const [activeScenario, setActiveScenario] = useState('NORMAL');
  const [showProjection, setShowProjection] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScenario = async (scenario: string) => {
    setLoading(true);
    setActiveScenario(scenario);
    setShowProjection(false);
    try {
      await onTriggerScenario(scenario);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (recId: number) => {
    setLoading(true);
    try {
      await onApplyAction(recId);
      setShowProjection(false);
    } finally {
      setLoading(false);
    }
  };

  // Scenarios list
  const scenarios = [
    { id: 'NORMAL', label: 'Normal State', desc: 'Average game time occupancy' },
    { id: 'MATCH_ENDED', label: 'Match Concluded', desc: 'Exit flow from stands to parking' },
    { id: 'ENTRY_SURGE', label: 'Entry Influx', desc: 'Gates scanning surge' },
    { id: 'FOOD_COURT_SURGE', label: 'Halftime Influx', desc: 'Food court congestion' },
    { id: 'CRITICAL_CONGESTION', label: 'Gate B Chokepoint', desc: 'Extreme bottleneck at Gate B', critical: true }
  ];

  // Find if there is a pending recommendation for crowd mitigation
  const pendingRec = crowdRecs.find(r => r.scenario_type === 'crowd' && r.status === 'Pending');

  // Chart data: Before vs After projected Wait Times (in minutes) at Gate B & C
  const projectionChartData = [
    { name: 'Gate B (Before)', WaitTime: 25, Queue: 185 },
    { name: 'Gate B (After)', WaitTime: 5, Queue: 40 },
    { name: 'Gate C (Before)', WaitTime: 3, Queue: 25 },
    { name: 'Gate C (After)', WaitTime: 5, Queue: 45 }
  ];

  return (
    <div className="space-y-6 font-sans" id="crowd-intelligence-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-primary" /> Stadium Crowd Simulation Engine
          </h2>
          <p className="text-xs text-gray-400 font-medium">Model spectator ingress/egress flows, evaluate scanner bottlenecks, and run AI crowd-control policies.</p>
        </div>
      </div>

      {/* Simulation Scenario Trigger Grid */}
      <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
        <h3 className="text-xs font-bold tracking-widest text-primary font-mono uppercase">Simulation Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenario(s.id)}
              disabled={loading}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between h-[90px] transition-all duration-200 ${
                activeScenario === s.id
                  ? s.critical
                    ? 'bg-status-red/20 text-status-red border-status-red shadow shadow-status-red/10'
                    : 'bg-primary/20 text-primary border-primary'
                  : 'bg-background border-border hover:border-primary/20 hover:text-white text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">{s.label}</span>
                {s.critical && <Flame className="w-3.5 h-3.5 animate-pulse text-status-red" />}
              </div>
              <p className="text-[9px] text-gray-500 leading-tight mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Telemetry Matrix & AI Recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left/Middle: Telemetry Matrix */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase">Telemetry Zone Matrix</h3>
            <span className="text-[10px] text-gray-500 font-mono">STATUS: SIMULATOR {activeScenario} ACTIVE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[9px] text-gray-500 uppercase font-mono tracking-wider">
                  <th className="py-2">Zone Name</th>
                  <th className="py-2">Occupancy</th>
                  <th className="py-2">In/Out Rate</th>
                  <th className="py-2">Queue</th>
                  <th className="py-2">Risk</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-border/20">
                {zones.map(z => (
                  <tr key={z.id} className="hover:bg-background/25 transition-colors">
                    <td className="py-2.5 font-bold uppercase">{z.name}</td>
                    <td className="py-2.5 text-gray-300">
                      {Math.round(z.occupancy_ratio * 100)}%
                      <span className="text-[9px] text-gray-500 font-mono ml-1">({z.current_occupancy.toLocaleString()} pax)</span>
                    </td>
                    <td className="py-2.5 text-gray-400 font-mono">
                      +{z.entry_rate} / -{z.exit_rate}
                    </td>
                    <td className="py-2.5 text-gray-300 font-mono">{z.queue_length} pax</td>
                    <td className="py-2.5 font-bold font-mono">
                      <span className={
                        z.risk_score > 80 ? 'text-status-red' :
                        z.risk_score > 50 ? 'text-status-amber' :
                        'text-status-green'
                      }>
                        {z.risk_score.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        z.status === 'CRITICAL' ? 'bg-status-red/15 text-status-red' :
                        z.status === 'HIGH' ? 'bg-status-amber/15 text-status-amber' :
                        z.status === 'WATCH' ? 'bg-status-amber/10 text-status-amber/80' :
                        'bg-status-green/10 text-status-green'
                      }`}>
                        {z.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: AI Intelligence Panel */}
        <div className="space-y-6">
          {pendingRec ? (
            /* AI Recommendation Panel active */
            <div className="bg-surface border border-status-blue/40 rounded-xl p-5 space-y-4 glow-cyan animate-scaleUp">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <div className="w-7 h-7 rounded-lg bg-status-blue/15 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-status-blue animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-status-blue tracking-widest font-mono uppercase">AI Crowd Mitigation Plan</h3>
                  <span className="text-[8px] text-gray-500 uppercase font-mono">Confidence: {(pendingRec.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-status-red font-mono uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Gate B Ingress Failure
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{pendingRec.summary}</p>
              </div>

              {/* Recommended Action Bullet Checklist */}
              <div className="bg-background/40 p-3 rounded border border-border space-y-2.5">
                <h4 className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Operational Dispatch Checklists:</h4>
                <div className="space-y-2 text-[10px] text-gray-300">
                  {pendingRec.recommended_actions.map((act, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-status-blue/20 text-status-blue font-mono font-bold flex items-center justify-center flex-shrink-0 text-[8px] mt-0.5">{index + 1}</span>
                      <div>
                        <span className="font-semibold text-white">{act.action}</span>
                        <p className="text-[9px] text-gray-500 mt-0.5">Impact: {act.expected_impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation comparison options */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setShowProjection(!showProjection)}
                  className="w-full bg-surface-light border border-border hover:text-white text-gray-400 text-[10px] font-extrabold uppercase py-2 rounded transition-colors"
                >
                  {showProjection ? 'Hide Simulation Graphs' : 'Simulate Projected Impact'}
                </button>

                {showProjection && (
                  <div className="bg-background/50 p-2.5 rounded-lg border border-border animate-fadeIn space-y-3">
                    <h5 className="text-[9px] text-status-blue font-mono uppercase text-center">Wait times & queue comparison (Before vs After)</h5>
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectionChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 8 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f1622', fontSize: '9px' }} />
                          <Bar dataKey="WaitTime" fill="#ff1744" name="Wait (mins)" />
                          <Bar dataKey="Queue" fill="#00b0ff" name="Queue (pax)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleApply(pendingRec.id)}
                  className="w-full bg-status-blue hover:bg-status-blue/80 text-black text-[10px] font-extrabold uppercase py-2.5 rounded shadow shadow-status-blue/25 transition-all"
                >
                  Apply Action Plan (Operator Confirm)
                </button>
              </div>

            </div>
          ) : (
            /* Safe baseline display */
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center text-gray-500 h-[280px]">
              <CheckCircle className="w-10 h-10 text-status-green mb-3" />
              <h4 className="text-xs font-bold text-gray-400 uppercase font-sans tracking-wider">Crowd Conditions nominal</h4>
              <p className="text-[10px] text-gray-500 max-w-[200px] mt-1.5">No bottlenecks detected. Select 'Gate B Chokepoint' to trigger crowd congestion scenario.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
