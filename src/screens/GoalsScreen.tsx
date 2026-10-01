import React, { useState, useEffect } from 'react';
import { Goal, GoalType } from '../types';
import { getAllGoals, saveGoal } from '../lib/storage';
import {
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Edit2,
  Calendar,
  RotateCcw,
} from 'lucide-react';

interface GoalsScreenProps {
  onRefreshData?: () => void;
}

const GOAL_CONFIG: Record<
  GoalType,
  { label: string; badge: string; durationDays: number; description: string }
> = {
  today: {
    label: "Today's Micro-Intention",
    badge: 'Daily',
    durationDays: 1,
    description: 'Immediate focus for this waking day',
  },
  month: {
    label: "This Month's Manifestation",
    badge: '30 Days',
    durationDays: 30,
    description: 'Consistent focus and deliberate practice',
  },
  year: {
    label: "This Year's Quantum Shift",
    badge: '365 Days',
    durationDays: 365,
    description: 'High-level transformation and tangible breakthroughs',
  },
  '5year': {
    label: '5-Year Strategic Horizon',
    badge: '5 Years',
    durationDays: 1825,
    description: 'Mastery, freedom, and foundational architecture',
  },
  '10year': {
    label: '10-Year Enduring Legacy',
    badge: '10 Years',
    durationDays: 3650,
    description: 'Your ultimate mark on the world',
  },
};

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onRefreshData }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [now, setNow] = useState(Date.now());
  const [dialogGoal, setDialogGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<{ type: GoalType; text: string; id?: string } | null>(
    null
  );

  const loadGoals = async () => {
    const list = await getAllGoals();
    setGoals(list);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown string
  const formatCountdown = (deadlineIso: string) => {
    const diff = new Date(deadlineIso).getTime() - now;
    if (diff <= 0) return 'Deadline Reached';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    return `${hours}h ${mins}m ${secs}s`;
  };

  const handleCompletionAnswer = async (achieved: boolean) => {
    if (!dialogGoal) return;

    if (achieved) {
      const updated: Goal = {
        ...dialogGoal,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      await saveGoal(updated);
      // Prompt to create a new one of same type
      setEditingGoal({ type: dialogGoal.type, text: '' });
    } else {
      // Extend deadline
      const config = GOAL_CONFIG[dialogGoal.type];
      const newDeadline = new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000);
      const updated: Goal = {
        ...dialogGoal,
        deadline: newDeadline.toISOString(),
        status: 'active',
      };
      await saveGoal(updated);
    }

    setDialogGoal(null);
    await loadGoals();
    onRefreshData?.();
  };

  const handleSaveGoalText = async () => {
    if (!editingGoal || !editingGoal.text.trim()) return;

    const config = GOAL_CONFIG[editingGoal.type];
    const setAt = new Date().toISOString();
    let deadline: string;

    if (editingGoal.type === 'today') {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      deadline = todayEnd.toISOString();
    } else {
      deadline = new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const newGoal: Goal = {
      id: editingGoal.id || crypto.randomUUID(),
      type: editingGoal.type,
      text: editingGoal.text.trim(),
      setAt,
      deadline,
      completedAt: null,
      status: 'active',
    };

    await saveGoal(newGoal);
    setEditingGoal(null);
    await loadGoals();
    onRefreshData?.();
  };

  const goalTypes: GoalType[] = ['today', 'month', 'year', '5year', '10year'];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold hero-text">
          Multi-Horizon Intentions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hold clear targets across day, month, year, and decades. Reality contracts to meet disciplined focus.
        </p>
      </div>

      {/* 5 Goal Cards */}
      <div className="space-y-4">
        {goalTypes.map((type) => {
          const config = GOAL_CONFIG[type];
          const activeGoal = goals.find((g) => g.type === type && g.status === 'active');
          const isExpired = activeGoal && new Date(activeGoal.deadline).getTime() <= now;

          return (
            <div
              key={type}
              className="bg-white dark:bg-[#1d2024] p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-accent-container text-accent flex items-center justify-center font-bold text-xs">
                    <Target className="w-4 h-4 text-accent" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
                      {config.label}
                    </h3>
                    <p className="text-[10px] text-slate-400">{config.description}</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent-container text-accent">
                  {config.badge}
                </span>
              </div>

              {activeGoal ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-[#f0f4ff]/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                    "{activeGoal.text}"
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                        {formatCountdown(activeGoal.deadline)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setEditingGoal({
                            type,
                            text: activeGoal.text,
                            id: activeGoal.id,
                          })
                        }
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                        title="Edit goal text"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDialogGoal(activeGoal)}
                        className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                          isExpired
                            ? 'bg-rose-600 text-white animate-bounce'
                            : 'bg-accent-container text-accent font-bold hover:opacity-90'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isExpired ? 'Evaluate Now' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-400">No active intention set for this horizon.</p>
                  <button
                    onClick={() => setEditingGoal({ type, text: '' })}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Set {config.badge} Goal</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Evaluation Dialog */}
      {dialogGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1d2024] p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-accent-container text-accent flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>

            <h3 className="font-bold text-lg text-[#1b1b1c] dark:text-white">
              Did you achieve it?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              "{dialogGoal.text}"
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleCompletionAnswer(false)}
                className="py-3 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-black/5 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Extend Time</span>
              </button>
              <button
                onClick={() => handleCompletionAnswer(true)}
                className="py-3 px-4 rounded-full bg-accent hover-bg-accent text-white font-bold text-xs shadow-md active:scale-95 transition"
              >
                Yes, Manifested! 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Goal Sheet */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1d2024] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1b1b1c] dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <span>Set {GOAL_CONFIG[editingGoal.type].label}</span>
              </h3>
              <button
                onClick={() => setEditingGoal(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">
              State your intention in clear, present-moment affirmative words:
            </p>

            <textarea
              rows={3}
              autoFocus
              value={editingGoal.text}
              onChange={(e) => setEditingGoal({ ...editingGoal, text: e.target.value })}
              placeholder="e.g., I am easily attracting ideal clients and generating effortless creative momentum..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 ring-accent"
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditingGoal(null)}
                className="px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoalText}
                className="px-6 py-2.5 rounded-full bg-accent hover-bg-accent text-white text-xs font-bold shadow transition active:scale-95"
              >
                Anchor Intention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
