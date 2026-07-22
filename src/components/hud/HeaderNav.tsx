import React from 'react';
import { Volume2, VolumeX, Flame, Activity, HelpCircle } from 'lucide-react';
import { useSimStore } from '../../store/useSimStore';
import type { LabMode } from '../../store/useSimStore';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface HeaderNavProps {
  onToggleTasks: () => void;
  onToggleTelemetry: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onToggleTasks, onToggleTelemetry }) => {
  const { labMode, setLabMode, isAudioMuted, toggleAudioMute, tasks } = useSimStore();

  const handleAudioToggle = () => {
    audioSystem.init();
    const muted = audioSystem.toggleMute();
    if (muted !== isAudioMuted) {
      toggleAudioMute();
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20 shadow-xl">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
            Matter & Thermodynamics Lab
            <span className="text-[10px] uppercase font-bold tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
              3D WebGL MVP
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">PhET Open Source Successor System</p>
        </div>
      </div>

      {/* Lab Mode Switcher Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        {(['PhaseStates', 'GasLaws', 'Diffusion'] as LabMode[]).map((mode) => {
          const isActive = labMode === mode;
          const label = mode === 'PhaseStates' ? 'Phase Dynamics' : mode === 'GasLaws' ? 'Gas Laws (PV=nRT)' : 'Diffusion';
          return (
            <button
              key={mode}
              onClick={() => setLabMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Action Toolbar */}
      <div className="flex items-center gap-3">
        {/* Guided Tasks Button */}
        <button
          onClick={onToggleTasks}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition active:scale-95 relative"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>Tasks</span>
          <span className="ml-1 bg-sky-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
            {completedCount}/{tasks.length}
          </span>
        </button>

        {/* Telemetry Button */}
        <button
          onClick={onToggleTelemetry}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition active:scale-95"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Telemetry</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={handleAudioToggle}
          className={`p-2 rounded-xl border transition active:scale-95 ${
            isAudioMuted
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
          }`}
          title={isAudioMuted ? 'Unmute Spatial Audio' : 'Mute Spatial Audio'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
