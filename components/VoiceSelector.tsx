import React from 'react';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-400">Voice Persona</label>
      <div className="relative">
        <select
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
          disabled={disabled}
          className="w-full appearance-none bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all hover:border-slate-600"
        >
          {Object.entries(VoiceName).map(([key, value]) => (
            <option key={key} value={value}>
              {key}
            </option>
          ))}
        </select>
        {/* Custom arrow icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-slate-500 px-1">
        {Object.keys(VoiceName).length} voices available.
      </p>
    </div>
  );
};

export default VoiceSelector;