import React, { useState } from 'react';
import { WavesLabCanvas } from '../components/3d/WavesLabCanvas';
import type { WaveSubMode, WaveTelemetry } from '../engine/WavePhysicsEngine';
import { Gauge, Sliders, Waves } from 'lucide-react';

interface WavesLabAppProps {
  onBackToLabMenu?: () => void;
}

export const WavesLabApp: React.FC<WavesLabAppProps> = ({ onBackToLabMenu }) => {
  const [mode, setMode] = useState<WaveSubMode>('WavePDE');
  const [frequencyHz, setFrequencyHz] = useState<number>(2.0);
  const [wavelengthNm, setWavelengthNm] = useState<number>(500);
  const [refractiveIndexN, setRefractiveIndexN] = useState<number>(1.5);

  const [telemetry, setTelemetry] = useState<WaveTelemetry>({
    timestamp: Date.now(),
    mode: 'WavePDE',
    frequencyHz: 2.0,
    wavelengthNm: 500,
    refractiveIndex: 1.5,
    diffractionAngleDeg: 14.5
  });

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      <header className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
              Wave Mechanics & Optics Lab
              <span className="text-[10px] uppercase font-bold tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                3D Wave PDE MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Wave Superposition, Two-Slit Interference & Snell's Law Optics</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: 'WavePDE', label: '3D Wave Surface' },
              { id: 'TwoSlitInterference', label: 'Two-Slit Diffraction' },
              { id: 'RefractionOptics', label: 'Laser Refraction' }
            ] as const
          ).map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as WaveSubMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md font-bold'
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
            <Sliders className="w-4 h-4 text-sky-400" />
            Wave Controls
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Wave Frequency (f)</span>
                <span className="font-mono font-bold text-sky-400">{frequencyHz.toFixed(1)} Hz</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={frequencyHz}
                onChange={(e) => setFrequencyHz(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Wavelength (λ)</span>
                <span className="font-mono font-bold text-cyan-400">{wavelengthNm} nm</span>
              </div>
              <input
                type="range"
                min={380}
                max={750}
                step={10}
                value={wavelengthNm}
                onChange={(e) => setWavelengthNm(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {mode === 'RefractionOptics' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Refractive Index (n)</span>
                  <span className="font-mono font-bold text-rose-400">{refractiveIndexN.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.5}
                  step={0.05}
                  value={refractiveIndexN}
                  onChange={(e) => setRefractiveIndexN(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 h-full relative bg-slate-950">
          <WavesLabCanvas
            mode={mode}
            frequencyHz={frequencyHz}
            wavelengthNm={wavelengthNm}
            refractiveIndexN={refractiveIndexN}
            onTelemetryUpdate={setTelemetry}
          />
        </main>

        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-l border-slate-800 p-5 flex flex-col gap-5 z-10 overflow-y-auto shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            Optics Readouts
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Diffraction θ</span>
              <span className="text-base font-mono font-bold text-sky-400">{telemetry.diffractionAngleDeg}°</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Index (n)</span>
              <span className="text-base font-mono font-bold text-rose-400">{telemetry.refractiveIndex}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
