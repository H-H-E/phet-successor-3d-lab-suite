import React, { useState } from 'react';
import { MotionLabCanvas } from '../components/3d/MotionLabCanvas';
import type { MotionSubMode, MotionTelemetry } from '../engine/MotionPhysicsEngine';
import { Flame, Gauge, Sliders, RotateCcw, Activity } from 'lucide-react';

interface MotionLabAppProps {
  onBackToLabMenu?: () => void;
}

export const MotionLabApp: React.FC<MotionLabAppProps> = ({ onBackToLabMenu }) => {
  const [mode, setMode] = useState<MotionSubMode>('Forces');
  const [appliedForce, setAppliedForce] = useState<number>(150);
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.3);
  const [massKg, setMassKg] = useState<number>(50);

  const [telemetry, setTelemetry] = useState<MotionTelemetry>({
    timestamp: Date.now(),
    mode: 'Forces',
    speed: 0,
    acceleration: 0,
    netForce: 0,
    kineticEnergy: 0,
    potentialEnergy: 0,
    thermalEnergy: 0,
    totalEnergy: 0
  });

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header Navigation */}
      <header className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
              Classical Mechanics & Dynamics Lab
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                3D Cannon-es MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Newtonian Forces, Energy Landscapes & Gravitational Orbits</p>
          </div>
        </div>

        {/* Sub-Mode Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: 'Forces', label: 'Forces & Friction' },
              { id: 'SkatePark', label: 'Energy Skate Park' },
              { id: 'Orbits', label: 'Gravitational Orbits' },
              { id: 'PendulumSpring', label: 'Harmonic Springs' }
            ] as const
          ).map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as MotionSubMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
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

      {/* Main Workspace (Sidebars + 3D Viewport) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Sidebar */}
        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-r border-slate-800 p-5 flex flex-col gap-6 z-10 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Physics Parameters
            </h2>
            <button
              onClick={() => {
                setAppliedForce(0);
                setFrictionCoeff(0.3);
                setMassKg(50);
              }}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="Reset Parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode 1: Forces Controls */}
          {mode === 'Forces' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Applied Force (F_app)</span>
                  <span className="font-mono font-bold text-emerald-400">{appliedForce} N</span>
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  step={10}
                  value={appliedForce}
                  onChange={(e) => setAppliedForce(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-500 N (Push Left)</span>
                  <span>0 N</span>
                  <span>+500 N (Push Right)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Friction Coefficient (μ)</span>
                  <span className="font-mono font-bold text-rose-400">{frictionCoeff.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={frictionCoeff}
                  onChange={(e) => setFrictionCoeff(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.00 (Frictionless)</span>
                  <span>1.00 (High Friction)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Object Mass (m)</span>
                  <span className="font-mono font-bold text-sky-400">{massKg} kg</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={massKg}
                  onChange={(e) => setMassKg(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Skate Park Controls */}
          {mode === 'SkatePark' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Track Friction (μ)</span>
                  <span className="font-mono font-bold text-rose-400">{frictionCoeff.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.02}
                  value={frictionCoeff}
                  onChange={(e) => setFrictionCoeff(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          )}

          {/* Vector Color Key Legend */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vector Color Key</span>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Applied Force
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Friction Force
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Net Force Vector
            </div>
          </div>
        </aside>

        {/* 3D WebGL Canvas Center Viewport */}
        <main className="flex-1 h-full relative bg-slate-950">
          <MotionLabCanvas
            mode={mode}
            appliedForce={appliedForce}
            frictionCoeff={frictionCoeff}
            massKg={massKg}
            onTelemetryUpdate={setTelemetry}
          />
        </main>

        {/* Right Readout & Energy Chart Sidebar */}
        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-l border-slate-800 p-5 flex flex-col gap-5 z-10 overflow-y-auto shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Kinematics Readouts
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Speed (v)</span>
              <span className="text-base font-mono font-bold text-emerald-400">{telemetry.speed} m/s</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Accel (a)</span>
              <span className="text-base font-mono font-bold text-sky-400">{telemetry.acceleration} m/s²</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1 col-span-2">
              <span className="text-[11px] text-slate-400 font-semibold">Net Force (F_net)</span>
              <span className="text-lg font-mono font-bold text-cyan-400">{telemetry.netForce} N</span>
            </div>
          </div>

          {/* Real-time Energy Bar Graph */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Energy Conservation Breakdown
            </span>

            {/* Kinetic Energy Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">Kinetic Energy (E_k)</span>
                <span className="font-mono font-bold text-emerald-400">{telemetry.kineticEnergy} J</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, (telemetry.kineticEnergy / Math.max(1, telemetry.totalEnergy || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Potential Energy Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-sky-400 font-semibold">Potential Energy (E_p)</span>
                <span className="font-mono font-bold text-sky-400">{telemetry.potentialEnergy} J</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, (telemetry.potentialEnergy / Math.max(1, telemetry.totalEnergy || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Thermal Energy Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-rose-400 font-semibold">Thermal Energy (E_th)</span>
                <span className="font-mono font-bold text-rose-400">{telemetry.thermalEnergy} J</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, (telemetry.thermalEnergy / Math.max(1, telemetry.totalEnergy || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
