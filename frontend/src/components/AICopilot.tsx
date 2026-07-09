import React, { useState } from 'react';
import { Cpu, Send, Sparkles, Loader2, AlertTriangle, ShieldCheck, CheckSquare, Info } from 'lucide-react';
import { CopilotResponse, CopilotAction } from '../types';

interface AICopilotProps {
  onCopilotQuery: (query: string) => Promise<CopilotResponse>;
  onTriggerTabAction: (actionType: string, payload?: any) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ onCopilotQuery, onTriggerTabAction }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; r?: CopilotResponse; error?: string }>>([]);

  const suggestedQueries = [
    "What requires my attention right now?",
    "Why is Gate B high risk?",
    "What happens if Match M08 is delayed by 40 minutes?",
    "Reschedule remaining matches with minimum disruption.",
    "Which incidents are at risk of SLA violation?",
    "Summarize tournament operations."
  ];

  const handleQuerySubmit = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setQuery('');

    // Add query to history immediately
    const newHistoryIndex = chatHistory.length;
    setChatHistory(prev => [...prev, { q: text }]);

    try {
      const response = await onCopilotQuery(text);
      setChatHistory(prev => {
        const copy = [...prev];
        copy[newHistoryIndex] = { q: text, r: response };
        return copy;
      });
    } catch (err) {
      console.error(err);
      setChatHistory(prev => {
        const copy = [...prev];
        copy[newHistoryIndex] = { q: text, error: 'Gemini Copilot offline. Rule-based model failed.' };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'text-status-red bg-status-red/10 border-status-red/30';
      case 'HIGH': return 'text-status-amber bg-status-amber/15 border-status-amber/35';
      case 'MEDIUM': return 'text-status-amber/80 bg-status-amber/10 border-status-amber/20';
      case 'LOW':
      default:
        return 'text-status-green bg-status-green/10 border-status-green/20';
    }
  };

  const handleApplyAction = (action: string) => {
    if (action.includes('Gate B') || action.includes('mitigation') || action.includes('traffic')) {
      onTriggerTabAction('CROWD_MITIGATION');
    } else if (action.includes('Reschedule') || action.includes('Apply Reschedule') || action.includes('solver') || action.includes('shifting')) {
      onTriggerTabAction('SCHEDULE_OPTIMIZE');
    } else if (action.includes('Dispatch') || action.includes('responder')) {
      onTriggerTabAction('INCIDENT_DISPATCH');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans" id="ai-copilot-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <Cpu className="w-5.5 h-5.5 text-primary" /> AI Operations Copilot Workspace
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Ask questions, inspect active telemetry chokepoints, evaluate rescheduling impacts, and execute mitigations. Backed by Gemini API and fallback operations solvers.
        </p>
      </div>

      {/* Suggested Queries Grid */}
      <div className="bg-surface border border-border p-4 rounded-xl space-y-2.5">
        <h4 className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Select Suggested Command Queries</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleQuerySubmit(sq)}
              disabled={loading}
              className="text-left bg-background/50 hover:bg-background/90 hover:text-white border border-border p-2.5 rounded text-[10px] font-semibold text-gray-400 flex items-center justify-between group transition-all"
            >
              <span>{sq}</span>
              <Sparkles className="w-3.5 h-3.5 text-primary/30 group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Workspace Arena */}
      <div className="bg-surface border border-border rounded-xl h-[450px] flex flex-col justify-between overflow-hidden">

        {/* Messages Feed Area */}
        <div className="flex-grow p-5 space-y-6 overflow-y-auto bg-background/25">
          {chatHistory.length > 0 ? (
            chatHistory.map((chat, idx) => (
              <div key={idx} className="space-y-4">
                {/* User Prompt Bubble */}
                <div className="flex justify-end">
                  <div className="bg-surface-light border border-border max-w-[80%] rounded-xl px-4 py-2 text-xs font-semibold text-white tracking-wide">
                    {chat.q}
                  </div>
                </div>

                {/* AI Response Card */}
                <div className="flex justify-start">
                  <div className="w-full max-w-[95%] bg-surface border border-border rounded-xl p-5 space-y-4">

                    {/* Header: AI status & confidence */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                          <Cpu className="w-3.5 h-3.5 text-primary animate-pulse" />
                        </div>
                        <span className="text-[10px] font-extrabold text-white tracking-widest font-mono uppercase">STADIUMOS COPILOT</span>
                      </div>

                      {chat.r && (
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold uppercase ${getRiskColor(chat.r.risk_level)}`}>
                            RISK: {chat.r.risk_level}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            Confidence: {(chat.r.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Loader */}
                    {!chat.r && !chat.error && (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Gemini generating recommendation context...</span>
                      </div>
                    )}

                    {/* Content Display */}
                    {chat.r && (
                      <div className="space-y-4">
                        {/* Summary */}
                        <p className="text-xs text-gray-200 leading-relaxed font-sans font-medium">{chat.r.summary}</p>

                        {/* Evidence Checklist */}
                        {chat.r.evidence && chat.r.evidence.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">Observed Evidence Checklist:</span>
                            <ul className="space-y-1 pl-1 text-[10px] text-gray-300">
                              {chat.r.evidence.map((ev, eIdx) => (
                                <li key={eIdx} className="flex gap-2 items-start">
                                  <span className="text-primary mt-0.5">â€¢</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended actions HUD card */}
                        {chat.r.recommended_actions && chat.r.recommended_actions.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">Recommended Action Plans:</span>
                            <div className="space-y-2">
                              {chat.r.recommended_actions.map((act, aIdx) => (
                                <div key={aIdx} className="bg-background/60 border border-border/80 rounded-lg p-3 space-y-2 hover:border-primary/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-white uppercase">{act.action}</div>
                                    <p className="text-[9px] text-gray-400 font-sans leading-relaxed">{act.reason}</p>
                                    <span className="text-[8px] text-primary font-mono uppercase">PROJECTED IMPACT: {act.expected_impact}</span>
                                  </div>

                                  {/* Quick Apply button if operator confirm is requested */}
                                  {chat.r?.requires_confirmation && (
                                    <button
                                      onClick={() => handleApplyAction(act.action)}
                                      className="flex-shrink-0 bg-primary hover:bg-primary-dark text-black text-[9px] font-extrabold uppercase px-3 py-1.5 rounded transition-all shadow shadow-primary/10"
                                    >
                                      Approve Plan
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Requires Confirmation alert */}
                        {chat.r.requires_confirmation && (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-status-amber uppercase bg-status-amber/5 border border-status-amber/20 px-3 py-2 rounded">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                            Human-in-the-loop operator confirmation is required to write changes to stadium DB.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Display */}
                    {chat.error && (
                      <p className="text-xs text-status-red bg-status-red/10 border border-status-red/20 p-3 rounded font-mono">
                        {chat.error}
                      </p>
                    )}

                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <Cpu className="w-10 h-10 text-border mb-3 animate-pulse" />
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Copilot Ready</h4>
              <p className="text-[10px] text-gray-500 max-w-[280px] mt-1.5 leading-relaxed">
                Click any of the suggested queries above, or input questions regarding current stadium telemetry, active match delays, and security response SLAs.
              </p>
            </div>
          )}
        </div>

        {/* Input Bar Area */}
        <div className="p-4 border-t border-border bg-surface flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuerySubmit(query); }}
            placeholder="Type command query (e.g. 'Summarize tournament operations', 'Why is Gate B high risk?')..."
            className="flex-grow bg-background border border-border text-xs rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors font-sans"
            disabled={loading}
          />
          <button
            onClick={() => handleQuerySubmit(query)}
            disabled={loading || !query.trim()}
            className="bg-primary hover:bg-primary-dark text-black px-4.5 py-2.5 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </div>
  );
};
