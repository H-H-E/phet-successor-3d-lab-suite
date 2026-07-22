import { useState } from 'react';
import { HeaderNav } from './components/hud/HeaderNav';
import { ControlPanel } from './components/hud/ControlPanel';
import { InstrumentsPanel } from './components/hud/InstrumentsPanel';
import { MatterLabCanvas } from './components/3d/MatterLabCanvas';
import { GuidedTasksModal } from './components/hud/GuidedTasksModal';
import { TelemetryPanel } from './components/hud/TelemetryPanel';
import { LiveAnnouncer } from './components/accessibility/LiveAnnouncer';

import { MotionLabApp } from './apps/MotionLabApp';
import { CircuitLabApp } from './apps/CircuitLabApp';
import { WavesLabApp } from './apps/WavesLabApp';
import { QuantumLabApp } from './apps/QuantumLabApp';

import { Flame, Compass, Zap, Waves, Atom } from 'lucide-react';

export type MasterLabType = 'MatterLab' | 'MotionLab' | 'CircuitLab' | 'WavesLab' | 'QuantumLab';

export function App() {
  const [activeLab, setActiveLab] = useState<MasterLabType>('MatterLab');
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  if (activeLab === 'MotionLab') {
    return <MotionLabApp onBackToLabMenu={() => setActiveLab('MatterLab')} />;
  }
  if (activeLab === 'CircuitLab') {
    return <CircuitLabApp onBackToLabMenu={() => setActiveLab('MatterLab')} />;
  }
  if (activeLab === 'WavesLab') {
    return <WavesLabApp onBackToLabMenu={() => setActiveLab('MatterLab')} />;
  }
  if (activeLab === 'QuantumLab') {
    return <QuantumLabApp onBackToLabMenu={() => setActiveLab('MatterLab')} />;
  }

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Navigation */}
      <HeaderNav
        onToggleTasks={() => setIsTasksOpen(true)}
        onToggleTelemetry={() => setIsTelemetryOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <ControlPanel />

        <main className="flex-1 h-full relative bg-slate-950">
          {/* Master Lab Switcher Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-2xl">
            <button
              onClick={() => setActiveLab('MatterLab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeLab === 'MatterLab'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-md'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Matter
            </button>

            <button
              onClick={() => setActiveLab('MotionLab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-emerald-400"
            >
              <Compass className="w-3.5 h-3.5" /> Motion
            </button>

            <button
              onClick={() => setActiveLab('CircuitLab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-amber-400"
            >
              <Zap className="w-3.5 h-3.5" /> Circuit
            </button>

            <button
              onClick={() => setActiveLab('WavesLab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
            >
              <Waves className="w-3.5 h-3.5" /> Waves
            </button>

            <button
              onClick={() => setActiveLab('QuantumLab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-purple-400"
            >
              <Atom className="w-3.5 h-3.5" /> Quantum
            </button>
          </div>

          <MatterLabCanvas />
        </main>

        <InstrumentsPanel />
      </div>

      {/* Modals */}
      <GuidedTasksModal isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />
      <TelemetryPanel isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />
      <LiveAnnouncer />
    </div>
  );
}

export default App;
