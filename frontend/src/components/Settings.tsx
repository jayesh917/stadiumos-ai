import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Cpu, Sparkles, Key, Check } from 'lucide-react';

interface SettingsProps {
  onResetDemo: () => Promise<void>;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  soundAlerts: boolean;
  setSoundAlerts: (v: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onResetDemo,
  largeText,
  setLargeText,
  highContrast,
  setHighContrast,
  reducedMotion,
  setReducedMotion,
  soundAlerts,
  setSoundAlerts
}) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans" id="settings-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <SettingsIcon className="w-5.5 h-5.5 text-primary" aria-hidden="true" /> Command Settings
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Configure API endpoints, adjust system simulation parameters, and manage external LLM model interfaces.
        </p>
      </div>

      {/* Accessibility Preferences Panel */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-border/40 pb-2 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-primary" aria-hidden="true" /> Accessibility Settings (WCAG 2.2 AA)
        </h3>
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Larger Typography Mode</span>
              <span className="text-[10px] text-gray-400">Scale base font sizes for improved readability.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={largeText}
              onClick={() => setLargeText(!largeText)}
              aria-label="Toggle larger typography mode"
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${largeText ? 'bg-primary' : 'bg-surface-light border border-border'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${largeText ? 'translate-x-6 bg-black' : 'bg-gray-400'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">High Contrast Mode</span>
              <span className="text-[10px] text-gray-400">Increase contrast ratio of borders and texts.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              aria-label="Toggle high contrast mode"
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${highContrast ? 'bg-primary' : 'bg-surface-light border border-border'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${highContrast ? 'translate-x-6 bg-black' : 'bg-gray-400'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Reduced Motion</span>
              <span className="text-[10px] text-gray-400">Disable transitions, confettis, and page animations.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
              aria-label="Toggle reduced motion"
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${reducedMotion ? 'bg-primary' : 'bg-surface-light border border-border'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${reducedMotion ? 'translate-x-6 bg-black' : 'bg-gray-400'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Operational Sound Alerts</span>
              <span className="text-[10px] text-gray-400">Activate auditory warnings for emergency incidents.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundAlerts}
              onClick={() => setSoundAlerts(!soundAlerts)}
              aria-label="Toggle operational sound alerts"
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${soundAlerts ? 'bg-primary' : 'bg-surface-light border border-border'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${soundAlerts ? 'translate-x-6 bg-black' : 'bg-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* API Key Panel */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-border/40 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" aria-hidden="true" /> Gemini AI Integration
        </h3>

        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="gemini-key" className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Gemini API Key</label>
            <input
              id="gemini-key"
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
            className="w-full bg-primary hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black text-black font-extrabold uppercase text-xs py-2 rounded transition-all flex items-center justify-center gap-1"
          >
            {saved ? <Check className="w-4 h-4" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
            {saved ? 'Settings Saved' : 'Apply AI Settings'}
          </button>
        </form>
      </div>

      {/* Dangerous Actions Area */}
      <div className="bg-surface border border-status-red/30 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-status-red uppercase border-b border-border/40 pb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" /> System Recovery
        </h3>

        <div className="space-y-3">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Resetting the demo will clear all active incidents, restore stands crowd density variables back to default baselines, and wipe current schedule shifts.
          </p>

          <button
            type="button"
            onClick={onResetDemo}
            className="w-full bg-status-red hover:bg-status-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white text-white font-extrabold uppercase text-xs py-2 rounded transition-all"
          >
            Wipe & Reset Demo Database
          </button>
        </div>
      </div>

    </div>
  );
};
