import React, { useEffect, useRef } from 'react';
import { useSimStore } from '../../store/useSimStore';

export const PhaseDiagramChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { temperatureK, pressureAtm, phaseState, species } = useSimStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Phase Region Colors
    // Solid (Bottom Left)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(40, 10, (width - 50) * 0.35, height - 35);

    // Liquid (Middle Top)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(40 + (width - 50) * 0.35, 10, (width - 50) * 0.35, (height - 35) * 0.5);

    // Gas (Right / Bottom)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(40 + (width - 50) * 0.35, 10 + (height - 35) * 0.5, (width - 50) * 0.65, (height - 35) * 0.5);

    // Phase Labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('SOLID', 55, 40);

    ctx.fillStyle = '#34d399';
    ctx.fillText('LIQUID', 130, 30);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GAS', 190, 85);

    // Boundary Coexistence Curves
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    // Sublimation & Vaporization curve using quadraticCurveTo
    ctx.beginPath();
    ctx.moveTo(40, height - 25);
    ctx.quadraticCurveTo(120, height - 40, 150, height - 60);
    ctx.quadraticCurveTo(200, height - 85, width - 10, 15);
    ctx.stroke();

    // Fusion (Melting) curve
    ctx.beginPath();
    ctx.moveTo(150, height - 60);
    ctx.lineTo(135, 10);
    ctx.stroke();

    // Triple Point Marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(150, height - 60, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Axes lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, height - 25);
    ctx.lineTo(width - 10, height - 25);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('T (K)', width / 2, height - 8);
    ctx.fillText('P (atm)', 5, 20);

    // Calculate current operating point coordinates
    const tRatio = Math.min(1, Math.max(0, temperatureK / (species.criticalPointTemp * 2)));
    const pRatio = Math.min(1, Math.max(0, pressureAtm / 10));

    const pointX = 40 + tRatio * (width - 50);
    const pointY = height - 25 - pRatio * (height - 35);

    // Glowing State Indicator Pulse Dot
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pointX, pointY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }, [temperatureK, pressureAtm, species]);

  return (
    <div className="flex flex-col bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          P-T Phase Diagram
        </span>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
          State: {phaseState}
        </span>
      </div>
      <canvas ref={canvasRef} width={280} height={130} className="w-full rounded-lg border border-slate-800" />
    </div>
  );
};
