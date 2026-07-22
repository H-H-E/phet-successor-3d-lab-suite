import React, { useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { CheckCircle2, Circle, HelpCircle, X, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface GuidedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTasksModal: React.FC<GuidedTasksModalProps> = ({ isOpen, onClose }) => {
  const { tasks } = useSimStore();

  const completedCount = tasks.filter((t) => t.completed).length;

  useEffect(() => {
    if (completedCount > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      audioSystem.playTaskSuccessSound();
    }
  }, [completedCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 flex flex-col gap-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Guided Learning Challenges</h2>
            <p className="text-xs text-slate-400">Complete tasks to explore kinetic molecular theory and gas laws.</p>
          </div>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition flex flex-col gap-2 ${
                task.completed
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                  <h3 className="font-semibold text-sm">{task.title}</h3>
                </div>
                {task.completed && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/30">
                    Completed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 ml-7 leading-relaxed">{task.prompt}</p>

              {/* Hint Box */}
              {!task.completed && (
                <div className="ml-7 mt-1 p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-2 text-[11px] text-sky-300">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{task.hint}</span>
                </div>
              )}

              {/* Scientific Explanation after completion */}
              {task.completed && (
                <div className="ml-7 mt-1 p-2.5 bg-emerald-900/20 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
                  <strong>Scientific Principle:</strong> {task.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
