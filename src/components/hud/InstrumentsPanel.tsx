import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { MaxwellBoltzmannChart } from '../charts/MaxwellBoltzmannChart';
import { PhaseDiagramChart } from '../charts/PhaseDiagramChart';
import { Gauge, Thermometer, Wind, Layers } from 'lucide-react';

export const InstrumentsPanel: React.FC = () => {
  const { temperatureK, pressureAtm, particleCount, phaseState } = useSimStore();

  return (
    <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-l border-slate-800 p-5 flex flex-col gap-5 z-10 overflow-y-auto shadow-2xl">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-sky-400" />
        Scientific Readouts & Instruments
      </h2>

      {/* Numerical Gauges Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Thermometer Readout */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temperature</span>
          </div>
          <span className="text-base font-mono font-bold text-slate-100">{temperatureK} K</span>
        </div>

        {/* Pressure Readout */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Pressure</span>
          </div>
          <span className="text-base font-mono font-bold text-slate-100">{pressureAtm.toFixed(2)} atm</span>
        </div>

        {/* Particle Count Readout */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Molecule Count</span>
          </div>
          <span className="text-base font-mono font-bold text-slate-100">{particleCount} N</span>
        </div>

        {/* Phase State Badge */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1 justify-center">
          <span className="text-[11px] text-slate-400 font-semibold">Phase State</span>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{phaseState}</span>
        </div>
      </div>

      {/* Real-time Charts */}
      <MaxwellBoltzmannChart />
      <PhaseDiagramChart />
    </aside>
  );
};
