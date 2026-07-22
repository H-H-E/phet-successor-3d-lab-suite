import React, { useEffect, useRef } from 'react';
import { useSimStore } from '../../store/useSimStore';

export const MaxwellBoltzmannChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { temperatureK, species } = useSimStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Background panel fill
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Axes & Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Horizontal & vertical gridlines
    for (let x = 40; x < width - 10; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
    }
    for (let y = 10; y < height - 25; y += 20) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    // Axes lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, height - 25);
    ctx.lineTo(width - 10, height - 25);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('0', 25, height - 10);
    ctx.fillText('Speed (m/s)', width / 2 - 25, height - 8);

    // Maxwell-Boltzmann theoretical curve calculation
    // f(v) = 4 * pi * (m / (2 * pi * k * T))^(3/2) * v^2 * exp(-m * v^2 / (2 * k * T))
    const T = Math.max(10, temperatureK);
    const m = species.mass * 1.66e-27;
    const kB = 1.38e-23;

    const vMax = Math.sqrt((2 * kB * T) / m);

    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    let isFirst = true;
    for (let px = 40; px < width - 10; px++) {
      const v = ((px - 40) / (width - 50)) * (vMax * 3);
      const factor = m / (2 * Math.PI * kB * T);
      const prob = 4 * Math.PI * Math.pow(factor, 1.5) * (v * v) * Math.exp((-m * v * v) / (2 * kB * T));

      const py = height - 25 - prob * (vMax * 8e4);

      if (isFirst) {
        ctx.moveTo(px, Math.max(10, py));
        isFirst = false;
      } else {
        ctx.lineTo(px, Math.max(10, py));
      }
    }
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(width - 10, height - 25);
    ctx.lineTo(40, height - 25);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
  }, [temperatureK, species]);

  return (
    <div className="flex flex-col bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Maxwell-Boltzmann Speed Distribution
        </span>
        <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
          T = {temperatureK} K
        </span>
      </div>
      <canvas ref={canvasRef} width={280} height={130} className="w-full rounded-lg border border-slate-800" />
    </div>
  );
};
