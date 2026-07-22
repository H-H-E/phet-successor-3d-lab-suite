import React from 'react';
import { useSimStore, SPECIES_PRESETS } from '../../store/useSimStore';
import { Play, Pause, Sliders, Box } from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const {
    species,
    setSpecies,
    isPlaying,
    setIsPlaying,
    temperatureK,
    setTemperatureK,
    containerWidth,
    containerHeight,
    containerDepth,
    setContainerDimensions,
    speedMultiplier,
    setSpeedMultiplier
  } = useSimStore();

  return (
    <aside className="w-80 bg-slate-900/90 backdrop-blur-lg border-r border-slate-800 p-5 flex flex-col gap-6 z-10 overflow-y-auto shadow-2xl">
      {/* Simulation Playback Controls */}
      <div className="flex flex-col gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>Clock Controls</span>
          <span>{speedMultiplier}x Speed</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition shadow-lg ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 0.5 : 1)}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            {speedMultiplier}x
          </button>
        </div>
      </div>

      {/* Chemical Species Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Molecular Species</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SPECIES_PRESETS.map((item) => {
            const isSelected = species.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSpecies(item)}
                className={`p-2.5 rounded-xl text-left border transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500/80 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{item.formula}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature Thermostat Slider */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Temperature</span>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {temperatureK} K ({Math.round(temperatureK - 273.15)} °C)
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={600}
          value={temperatureK}
          onChange={(e) => setTemperatureK(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
          <span>5 K (Absolute Zero)</span>
          <span>300 K (Room)</span>
          <span>600 K (Hot)</span>
        </div>
      </div>

      {/* Container Volume Dimensions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" />
            <span>Container Volume</span>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {Math.round((containerWidth * containerHeight * containerDepth) / 1000)} nm³
          </span>
        </div>

        {/* Width Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Container Width (X)</span>
            <span>{containerWidth} nm</span>
          </div>
          <input
            type="range"
            min={15}
            max={45}
            value={containerWidth}
            onChange={(e) => setContainerDimensions(Number(e.target.value), containerHeight, containerDepth)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Height Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Container Height (Y)</span>
            <span>{containerHeight} nm</span>
          </div>
          <input
            type="range"
            min={15}
            max={45}
            value={containerHeight}
            onChange={(e) => setContainerDimensions(containerWidth, Number(e.target.value), containerDepth)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </aside>
  );
};
