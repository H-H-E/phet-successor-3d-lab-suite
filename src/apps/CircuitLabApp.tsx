import React, { useState } from 'react';
import { CircuitLabCanvas } from '../components/3d/CircuitLabCanvas';
import type { CircuitSubMode, CircuitTelemetry } from '../engine/CircuitPhysicsEngine';
import { Gauge, Sliders, Zap } from 'lucide-react';

interface CircuitLabAppProps {
  onBackToLabMenu?: () => void;
}

export const CircuitLabApp: React.FC<CircuitLabAppProps> = ({ onBackToLabMenu }) => {
  const [mode, setMode] = useState<CircuitSubMode>('ChargesAndFields');
  const [voltageSource, setVoltageSource] = useState<number>(9);
  const [resistanceOhms, setResistanceOhms] = useState<number>(10);
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);

  const [telemetry, setTelemetry] = useState<CircuitTelemetry>({
    timestamp: Date.now(),
    mode: 'ChargesAndFields',
    currentAmps: 0.9,
    voltageVolts: 9,
    totalResistanceOhms: 10,
    powerWatts: 8.1,
    electricFieldMax: 10
  });

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      <header className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-6 py-3 flex items-center justify-between z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
              Electromagnetism & Circuit Lab
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                3D Coulomb MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Coulomb Electric Fields, Ohm's Law & Circuit Topology</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: 'ChargesAndFields', label: 'Charges & Field Lines' },
              { id: 'ElectronDrift', label: 'Resistor Lattice' },
              { id: 'Breadboard', label: 'DC Breadboard' }
            ] as const
          ).map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as CircuitSubMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md font-bold'
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
            <Sliders className="w-4 h-4 text-amber-400" />
            Circuit Parameters
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Battery Voltage (V)</span>
                <span className="font-mono font-bold text-amber-400">{voltageSource} V</span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={voltageSource}
                onChange={(e) => setVoltageSource(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Resistor Value (R)</span>
                <span className="font-mono font-bold text-sky-400">{resistanceOhms} Ω</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={resistanceOhms}
                onChange={(e) => setResistanceOhms(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <button
              onClick={() => setIsSwitchClosed(!isSwitchClosed)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition ${
                isSwitchClosed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isSwitchClosed ? 'Switch CLOSED (Circuit On)' : 'Switch OPEN (Circuit Off)'}
            </button>
          </div>
        </aside>

        <main className="flex-1 h-full relative bg-slate-950">
          <CircuitLabCanvas
            mode={mode}
            voltageSource={voltageSource}
            resistanceOhms={resistanceOhms}
            isSwitchClosed={isSwitchClosed}
            onTelemetryUpdate={setTelemetry}
          />
        </main>

        <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-l border-slate-800 p-5 flex flex-col gap-5 z-10 overflow-y-auto shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            Digital Multimeter
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Current (I)</span>
              <span className="text-base font-mono font-bold text-emerald-400">{telemetry.currentAmps} A</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Power (P)</span>
              <span className="text-base font-mono font-bold text-amber-400">{telemetry.powerWatts} W</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
