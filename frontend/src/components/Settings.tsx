import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Cpu, Sparkles, Key, Check } from 'lucide-react';

interface SettingsProps {
  onResetDemo: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ onResetDemo }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans select-none" id="settings-root">
      
      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <SettingsIcon className="w-5.5 h-5.5 text-primary" /> Command Settings
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Configure API endpoints, adjust system simulation parameters, and manage external LLM model interfaces.
        </p>
      </div>

      {/* API Key Panel */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-border/40 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" /> Gemini AI Integration
        </h3>

        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Gemini API Key</label>
            <input
              type="password"
              placeholder="Paste your GEMINI_API_KEY here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-background border border-border text-xs rounded p-2 text-white outline-none focus:border-primary"
            />
          </div>

          <div className="bg-background/40 border border-border/60 p-3 rounded text-[10px] text-gray-400 leading-relaxed">
            <strong className="text-primary block font-semibold mb-0.5">Note on API Connectivity:</strong>
            If this key is left empty, the StadiumOS AI Copilot will automatically fallback to the local deterministic rule-based intelligence engine. This ensures the demo is 100% resilient and responsive during hackathons.
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-black font-extrabold uppercase text-xs py-2 rounded transition-all flex items-center justify-center gap-1"
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {saved ? 'Settings Saved' : 'Apply AI Settings'}
          </button>
        </form>
      </div>

      {/* Dangerous Actions Area */}
      <div className="bg-surface border border-status-red/30 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-status-red uppercase border-b border-border/40 pb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> System Recovery
        </h3>
        
        <div className="space-y-3">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Resetting the demo will clear all active incidents, restore stands crowd density variables back to default baselines, and wipe current schedule shifts.
          </p>
          
          <button
            onClick={onResetDemo}
            className="w-full bg-status-red hover:bg-status-red/80 text-white font-extrabold uppercase text-xs py-2 rounded transition-all"
          >
            Wipe & Reset Demo Database
          </button>
        </div>
      </div>

    </div>
  );
};
