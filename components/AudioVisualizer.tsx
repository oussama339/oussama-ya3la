import React from 'react';

interface AudioVisualizerProps {
  volume: number; // 0 to 255 usually
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, isActive }) => {
  // Normalize volume 0-1
  const norm = Math.min(volume / 50, 1.5); 
  const scale = isActive ? 1 + norm : 1;
  const color = isActive ? 'bg-blue-500' : 'bg-slate-600';
  const glow = isActive ? 'shadow-[0_0_30px_rgba(59,130,246,0.6)]' : 'shadow-none';

  return (
    <div className="relative flex items-center justify-center h-64 w-64">
      {/* Outer ripples */}
      {isActive && (
        <>
           <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
           <div className="absolute w-3/4 h-3/4 rounded-full bg-blue-400 opacity-20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
        </>
      )}
      
      {/* Core orb */}
      <div 
        className={`relative z-10 w-32 h-32 rounded-full ${color} ${glow} transition-all duration-100 ease-out flex items-center justify-center`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className="w-24 h-24 bg-white/10 rounded-full backdrop-blur-sm"></div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
