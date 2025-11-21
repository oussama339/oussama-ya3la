import React, { useState, useEffect } from 'react';
import { VoiceName } from './types';
import { useLiveApi } from './hooks/use-live-api';
import { useTTS } from './hooks/use-tts';
import AudioVisualizer from './components/AudioVisualizer';
import VoiceSelector from './components/VoiceSelector';

const App: React.FC = () => {
  const [mode, setMode] = useState<'live' | 'tts'>('live');
  const [voiceName, setVoiceName] = useState<VoiceName>(VoiceName.Kore);
  const [systemInstruction, setSystemInstruction] = useState("You are a helpful and witty AI assistant.");
  const [ttsText, setTtsText] = useState("");

  // Hooks
  const { 
    connect, 
    disconnect, 
    connectionState, 
    error: liveError, 
    volume 
  } = useLiveApi({ voiceName, systemInstruction });
  
  const { speak, isLoading: isTtsLoading, error: ttsError, audioUrl } = useTTS({ voiceName });

  const isLiveActive = connectionState === 'connected';
  const isLiveConnecting = connectionState === 'connecting';

  // Handle Live Toggle
  const handleLiveToggle = () => {
    if (isLiveActive || isLiveConnecting) {
      disconnect();
    } else {
      connect();
    }
  };

  // Handle TTS
  const handleSpeak = () => {
    speak(ttsText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Settings */}
      <aside className="w-full md:w-80 p-6 border-r border-slate-800 bg-slate-900/50 flex flex-col gap-8 overflow-y-auto z-20">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gemini Voice
          </h1>
          <p className="text-sm text-slate-500 mt-1">Native Audio & Live API</p>
        </div>

        {/* Mode Switcher */}
        <div className="p-1 bg-slate-800 rounded-xl flex">
          <button 
            onClick={() => setMode('live')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'live' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Live Conversation
          </button>
          <button 
            onClick={() => setMode('tts')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'tts' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Text to Speech
          </button>
        </div>

        <VoiceSelector 
            selectedVoice={voiceName} 
            onVoiceChange={setVoiceName} 
            disabled={isLiveActive}
        />

        {mode === 'live' && (
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">System Instruction</label>
                <textarea 
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    disabled={isLiveActive}
                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="Define the AI's personality..."
                />
                <p className="text-xs text-slate-500">
                    {isLiveActive ? "Disconnect to edit instructions." : "Instructions define how the model behaves."}
                </p>
            </div>
        )}

        {/* Error Display */}
        {(liveError || ttsError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {liveError || ttsError}
            </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">
        
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="z-10 flex flex-col items-center gap-12 w-full max-w-2xl">
            
            {/* Visualizer Section */}
            <div className="relative">
                <AudioVisualizer 
                    volume={mode === 'live' ? volume : (isTtsLoading ? 50 : 0)} 
                    isActive={isLiveActive || isTtsLoading} 
                />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-slate-400 font-medium">
                    {mode === 'live' 
                        ? (isLiveActive ? "Listening & Speaking..." : isLiveConnecting ? "Connecting..." : "Ready to Chat")
                        : (isTtsLoading ? "Generating Speech..." : "Ready to Speak")
                    }
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md space-y-6">
                
                {mode === 'live' ? (
                    <div className="flex justify-center">
                        <button
                            onClick={handleLiveToggle}
                            className={`
                                relative group px-8 py-4 rounded-full font-semibold text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95
                                ${isLiveActive 
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30'}
                            `}
                        >
                            {isLiveActive ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    End Session
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    Start Conversation
                                </span>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-800/80 backdrop-blur p-2 rounded-2xl shadow-xl border border-slate-700/50">
                        <div className="relative flex flex-col">
                            <textarea
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value)}
                                placeholder="Type something to speak..."
                                className="w-full h-32 bg-transparent p-4 text-lg text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
                            />
                            <div className="flex items-center justify-end gap-2 p-2 border-t border-slate-700/50 mt-2">
                                {audioUrl && (
                                    <a
                                        href={audioUrl}
                                        download={`gemini-voice-${Date.now()}.wav`}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium shadow-lg shadow-emerald-900/20"
                                        title="Download Audio"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Audio
                                    </a>
                                )}
                                <button
                                    onClick={handleSpeak}
                                    disabled={isTtsLoading || !ttsText.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl px-6 py-2 font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    {isTtsLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                    )}
                                    Speak
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="text-center text-slate-500 text-sm max-w-lg">
                {mode === 'live' 
                    ? "Powered by Gemini 2.5 Native Audio (Live API). Experience real-time, bi-directional voice conversations."
                    : "High-quality Text-to-Speech generation powered by Gemini 2.5 models."
                }
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;