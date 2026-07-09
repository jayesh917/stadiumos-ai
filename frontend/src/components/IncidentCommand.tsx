import React, { useState } from 'react';
import { Incident, ResponseTeam, AIRecommendation } from '../types';
import {
  AlertOctagon,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  UserCheck,
  Zap,
  Loader2,
  Shield,
  HeartPulse,
  Flame,
  Wrench
} from 'lucide-react';

interface IncidentCommandProps {
  incidents: Incident[];
  responders: ResponseTeam[];
  incidentRecs: AIRecommendation[];
  onReportIncident: (data: any) => Promise<void>;
  onAssignResponder: (incidentId: number, responderId: number) => Promise<void>;
  onResolveIncident: (incidentId: number) => Promise<void>;
}

export const IncidentCommand: React.FC<IncidentCommandProps> = ({
  incidents,
  responders,
  incidentRecs,
  onReportIncident,
  onAssignResponder,
  onResolveIncident
}) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState<number | string | null>(null);

  // Form State
  const [type, setType] = useState('Medical');
  const [location, setLocation] = useState('East Stand');
  const [priority, setPriority] = useState('High');
  const [description, setDescription] = useState('Spectator experiencing breathing difficulty.');

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('report');
    try {
      await onReportIncident({ type, location, priority, description });
      setShowReportForm(false);
      setDescription('');
    } finally {
      setLoading(null);
    }
  };

  const handleSimulateMedical = async () => {
    setLoading('simulate');
    try {
      await onReportIncident({
        type: 'Medical',
        location: 'East Stand',
        description: 'Spectator experiencing chest pain in East Stand row 14.',
        priority: 'Critical'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDispatch = async (incId: number, respId: number) => {
    setLoading(incId);
    try {
      await onAssignResponder(incId, respId);
    } finally {
      setLoading(null);
    }
  };

  const handleResolve = async (incId: number) => {
    setLoading(incId);
    try {
      await onResolveIncident(incId);
    } finally {
      setLoading(null);
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'Critical': return 'bg-status-red/15 text-status-red border border-status-red/35';
      case 'High': return 'bg-status-amber/15 text-status-amber border border-status-amber/35';
      case 'Medium': return 'bg-status-amber/10 text-status-amber/80';
      case 'Low':
      default:
        return 'bg-status-green/10 text-status-green';
    }
  };

  const getIncidentIcon = (incType: string) => {
    switch (incType) {
      case 'Medical': return HeartPulse;
      case 'Security': return Shield;
      case 'Crowd': return Flame;
      case 'Equipment':
      case 'Infrastructure':
        return Wrench;
      default:
        return AlertOctagon;
    }
  };

  const unresolvedIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  return (
    <div className="space-y-6 font-sans" id="incident-command-root">

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <AlertOctagon className="w-5.5 h-5.5 text-primary" /> Incident Command Center
          </h2>
          <p className="text-xs text-gray-400 font-medium">Log on-site medical and security reports, dispatch responder units, and monitor SLA response metrics.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateMedical}
            disabled={loading !== null}
            className="bg-status-red text-white hover:bg-status-red/80 text-xs font-extrabold uppercase px-4 py-2.5 rounded flex items-center gap-1.5 transition-all shadow shadow-status-red/20"
          >
            {loading === 'simulate' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-white" />
            )}
            Simulate Medical Emergency
          </button>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="bg-surface-light border border-border text-gray-300 hover:text-white hover:bg-border/30 text-xs font-extrabold uppercase px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" /> Report Custom Incident
          </button>
        </div>
      </div>

      {/* Custom Incident Form Drawer */}
      {showReportForm && (
        <div className="bg-surface border border-border p-5 rounded-xl animate-scaleUp">
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase pb-2 border-b border-border/40">Report New Incident Field</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase">Incident Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none cursor-pointer focus:border-primary"
                >
                  <option value="Medical">Medical Emergency</option>
                  <option value="Security">Security Intercession</option>
                  <option value="Crowd">Crowd Anomaly</option>
                  <option value="Equipment">Equipment Defect</option>
                  <option value="Infrastructure">Infrastructure Issue</option>
                  <option value="Lost Person">Lost Person Report</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase">Stadium Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none cursor-pointer focus:border-primary"
                >
                  <option value="North Stand">North Stand</option>
                  <option value="South Stand">South Stand</option>
                  <option value="East Stand">East Stand</option>
                  <option value="West Stand">West Stand</option>
                  <option value="Food Court">Food Court</option>
                  <option value="Entry Gate A">Entry Gate A</option>
                  <option value="Entry Gate B">Entry Gate B</option>
                  <option value="Entry Gate C">Entry Gate C</option>
                  <option value="Parking Area">Parking Area</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none cursor-pointer focus:border-primary"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={loading !== null}
                  className="w-full bg-primary hover:bg-primary-dark text-black font-extrabold text-xs py-2.5 rounded transition-all uppercase"
                >
                  {loading === 'report' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Incident'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 font-mono uppercase">Description Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary h-16 font-sans resize-none"
                placeholder="Describe details of incident..."
                required
              />
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Active incidents vs Responders Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left/Middle Column: Incidents Feeds */}
        <div className="xl:col-span-2 space-y-6">

          {/* Active Incidents */}
          <div className="bg-surface border border-border p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-border/40 pb-2">
              ACTIVE INCIDENTS ({unresolvedIncidents.length})
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {unresolvedIncidents.length > 0 ? (
                unresolvedIncidents.map(inc => {
                  const IncIcon = getIncidentIcon(inc.type);
                  const isWorking = loading === inc.id;

                  // Find AI Recommendation for this incident
                  const incRec = incidentRecs.find(r => r.evidence.some(e => e.includes(inc.description)) && r.status === 'Pending');

                  return (
                    <div key={inc.id} className="bg-background border border-border/80 rounded-xl p-4.5 space-y-3.5 hover:border-primary/20 transition-colors">
                      {/* Meta header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                            <IncIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-white uppercase flex items-center gap-2">
                              INCIDENT #{inc.id} â€¢ {inc.type}
                            </h4>
                            <div className="flex items-center gap-3 mt-0.5 text-[9px] text-gray-500 font-mono uppercase">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {inc.location}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {new Date(inc.reported_at).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getPriorityColor(inc.priority)}`}>
                            {inc.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-light border border-border text-gray-400 text-[8px] font-extrabold uppercase">
                            {inc.status}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-gray-300 leading-relaxed font-sans bg-surface/30 p-2.5 rounded border border-border/30">
                        {inc.description}
                      </p>

                      {/* AI dispatch recommendation block */}
                      {inc.status === 'REPORTED' && incRec && (
                        <div className="bg-status-blue/5 border border-status-blue/20 p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-status-blue font-bold text-[9px] font-mono uppercase">
                              <Zap className="w-3.5 h-3.5 animate-pulse" /> Dispatch Suggestion
                            </div>
                            {incRec.recommended_actions.map((act, aIdx) => (
                              <p key={aIdx} className="text-[10px] text-gray-300">
                                Recommend: <strong className="text-white">{act.action.replace('Dispatch ', '')}</strong> â€¢ {act.reason} (ETA: 2m)
                              </p>
                            ))}
                          </div>

                          {/* Approve Dispatch action */}
                          <div className="flex-shrink-0">
                            {responders.filter(r => r.status === 'Available').length > 0 ? (
                              <button
                                onClick={() => {
                                  // Extract suggested responder name
                                  const actionText = incRec.recommended_actions[0].action;
                                  const nameToFind = actionText.replace('Dispatch ', '');
                                  const suggResp = responders.find(r => r.name === nameToFind && r.status === 'Available');
                                  if (suggResp) {
                                    handleDispatch(inc.id, suggResp.id);
                                  } else {
                                    // Fallback to first available
                                    const av = responders.find(r => r.status === 'Available');
                                    if (av) handleDispatch(inc.id, av.id);
                                  }
                                }}
                                disabled={isWorking}
                                className="bg-status-blue hover:bg-status-blue/80 text-black text-[9px] font-extrabold uppercase px-3 py-1.5 rounded transition-colors shadow shadow-status-blue/15"
                              >
                                {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve Dispatch'}
                              </button>
                            ) : (
                              <span className="text-[8px] font-bold text-status-red uppercase">No units available</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Manual Dispatch / Resolution Actions */}
                      <div className="flex justify-end gap-2 pt-1 border-t border-border/20">
                        {inc.status === 'REPORTED' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 font-mono uppercase">Assign Unit:</span>
                            <select
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val) handleDispatch(inc.id, val);
                              }}
                              className="bg-surface-light border border-border text-[10px] text-white rounded px-2 py-1 outline-none cursor-pointer focus:border-primary"
                              defaultValue=""
                            >
                              <option value="" disabled>Select Unit...</option>
                              {responders.filter(r => r.status === 'Available').map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {inc.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleResolve(inc.id)}
                            disabled={isWorking}
                            className="bg-status-green hover:bg-status-green/80 text-black text-[9px] font-extrabold uppercase px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                          >
                            {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Resolve Incident On-site
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic py-12 text-center">No active operational incidents.</p>
              )}
            </div>
          </div>

          {/* Historical Resolved Incidents */}
          <div className="bg-surface border border-border p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase border-b border-border/40 pb-2">
              RESOLVED LOGS ({resolvedIncidents.length})
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {resolvedIncidents.map(inc => (
                <div key={inc.id} className="text-[10px] border-b border-border/40 pb-2 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-bold text-gray-300">INCIDENT #{inc.id} ({inc.type})</span> â€¢ <span className="text-gray-500 font-mono">{inc.location}</span>
                    <p className="text-gray-400 font-sans mt-0.5">{inc.description}</p>
                    <span className="text-[8px] text-status-green font-mono uppercase mt-1 block">
                      Resolved in {inc.response_time_seconds ? Math.round(inc.response_time_seconds / 60) : 4}m by {inc.responder?.name}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono flex-shrink-0 mt-0.5">
                    {new Date(inc.reported_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Responder units telemetry status */}
        <div className="bg-surface border border-border p-5 rounded-xl space-y-4 h-fit">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase border-b border-border/40 pb-2">
            RESPONSE UNITS TELEMETRY
          </h3>
          <div className="space-y-3.5">
            {responders.map(r => (
              <div key={r.id} className="p-3 bg-background border border-border rounded-lg flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-white uppercase">{r.name}</h4>
                  <div className="flex items-center gap-3 text-[9px] text-gray-500 font-mono">
                    <span>{r.type} Unit</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-primary" /> {r.location}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                  r.status === 'Available' ? 'bg-status-green/10 text-status-green border border-status-green/20' :
                  r.status === 'Busy' ? 'bg-status-amber/15 text-status-amber animate-pulse' :
                  'bg-surface-light text-gray-500'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
