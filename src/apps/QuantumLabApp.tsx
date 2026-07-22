import React, { useState } from 'react';
import { QuantumLabCanvas } from '../components/3d/QuantumLabCanvas';
import type { QuantumSubMode, QuantumTelemetry } from '../engine/QuantumPhysicsEngine';
import { Atom, Gauge, Sliders } from 'lucide-react';

interface QuantumLabAppProps {
  onBackToLabMenu?: () => void;
}

export const QuantumLabApp: React.FC<QuantumLabAppProps> = ({ onBackToLabMenu }) => {
  const [mode, setMode] = useState<QuantumSubMode>('BuildAtom');
  const [protons, setProtons] = useState<number>(6);
  const [neutrons, setNeutrons] = useState<number>(6);
  const [electrons, setElectrons] = useState<number>(6);
  const [alphaEnergyMeV] = useState<number>(5.0);

  const [telemetry, setTelemetry] = useState<QuantumTelemetry>({
    timestamp: Date.now(),
    mode: 'BuildAtom',
    protons: 6,
    neutrons: 6,
    electrons: 6,
    massNumber: 12,
    netCharge: 0,
    elementSymbol: 'C',
    isStable: true,
    scatteringAngleDeg: 18.2
  });

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      <header className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Atom className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
              Atomic & Quantum Lab
              <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                3D Bohr Model MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Subatomic Assembly, Isotopes & Rutherford Alpha Scattering</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: 'BuildAtom', label: 'Build an Atom' },
              { id: 'RutherfordScattering', label: 'Rutherford Scattering' },
              { id: 'Photochemistry', label: 'Photochemistry' }
            ] as const
          ).map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as QuantumSubMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {onBackToLabMenu && (
          <button
            onClick={onBackToLabMenu}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            ← Back to Lab Selection
          </button>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-r border-slate-800 p-5 flex flex-col gap-6 z-10 overflow-y-auto shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Subatomic Particle Buckets
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
              <span className="text-xs font-semibold text-rose-300">Protons (p+)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setProtons(Math.max(1, protons - 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">-</button>
                <span className="font-mono font-bold text-rose-400 w-6 text-center">{protons}</span>
                <button onClick={() => setProtons(Math.min(10, protons + 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Neutrons (n0)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setNeutrons(Math.max(0, neutrons - 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">-</button>
                <span className="font-mono font-bold text-slate-300 w-6 text-center">{neutrons}</span>
                <button onClick={() => setNeutrons(Math.min(12, neutrons + 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-sky-950/40 p-3 rounded-xl border border-sky-500/30">
              <span className="text-xs font-semibold text-sky-300">Electrons (e-)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setElectrons(Math.max(0, electrons - 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">-</button>
                <span className="font-mono font-bold text-sky-400 w-6 text-center">{electrons}</span>
                <button onClick={() => setElectrons(Math.min(10, electrons + 1))} className="px-2 py-1 bg-slate-800 rounded font-mono">+</button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 h-full relative bg-slate-950">
          <QuantumLabCanvas
            mode={mode}
            protons={protons}
            neutrons={neutrons}
            electrons={electrons}
            alphaEnergyMeV={alphaEnergyMeV}
            onTelemetryUpdate={setTelemetry}
          />
        </main>

        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-l border-slate-800 p-5 flex flex-col gap-5 z-10 overflow-y-auto shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            Periodic Table Readout
          </h2>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-purple-500/30 flex flex-col items-center gap-2 shadow-xl">
            <span className="text-4xl font-extrabold text-purple-400 tracking-wider font-mono">{telemetry.elementSymbol}</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Mass: <strong className="text-slate-100 font-mono">{telemetry.massNumber}</strong></span>
              <span className="text-slate-400">Charge: <strong className="text-slate-100 font-mono">{telemetry.netCharge > 0 ? `+${telemetry.netCharge}` : telemetry.netCharge}</strong></span>
            </div>

            <span className={`mt-2 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
              telemetry.isStable ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {telemetry.isStable ? 'STABLE NUCLEUS' : 'UNSTABLE ISOTOPE'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
