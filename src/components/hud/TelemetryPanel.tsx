import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { Activity, Download, Trash2, X } from 'lucide-react';

interface TelemetryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ isOpen, onClose }) => {
  const { telemetryHistory, clearTelemetry } = useSimStore();

  if (!isOpen) return null;

  const downloadCSV = () => {
    if (telemetryHistory.length === 0) return;

    const headers = ['Timestamp', 'Temperature_K', 'Pressure_atm', 'Volume_nm3', 'Particle_Count', 'Kinetic_Energy', 'Phase_State'];
    const rows = telemetryHistory.map((t) => [
      new Date(t.timestamp).toISOString(),
      t.temperatureK,
      t.pressureAtm,
      t.volumeNm3,
      t.particleCount,
      t.kineticEnergy,
      t.phaseState
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `matter_lab_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl p-6 flex flex-col gap-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Simulation Data Telemetry</h2>
              <p className="text-xs text-slate-400">Real-time state logging for data collection and lab reports.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              disabled={telemetryHistory.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={clearTelemetry}
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition"
              title="Clear Log History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Log Table */}
        <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Temp (K)</th>
                <th className="p-3">Pressure (atm)</th>
                <th className="p-3">Volume (nm³)</th>
                <th className="p-3">Particles (N)</th>
                <th className="p-3">Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {telemetryHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-500 font-sans">
                    No telemetry records logged yet. Run simulation to collect data.
                  </td>
                </tr>
              ) : (
                telemetryHistory.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 text-amber-400 font-semibold">{t.temperatureK}</td>
                    <td className="p-3 text-sky-400">{t.pressureAtm}</td>
                    <td className="p-3 text-emerald-400">{t.volumeNm3}</td>
                    <td className="p-3">{t.particleCount}</td>
                    <td className="p-3 font-sans text-slate-300 uppercase font-semibold text-[11px]">{t.phaseState}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
