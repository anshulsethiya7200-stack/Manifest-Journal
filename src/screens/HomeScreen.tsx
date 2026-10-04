import React, { useState } from 'react';
import { Profile, Goal } from '../types';
import { saveGoal } from '../lib/storage';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { DailyAffirmationCard } from '../components/DailyAffirmationCard';
import {
  Sun,
  Calendar,
  PenTool,
  BookOpen,
  Camera,
  Check,
  Sparkles,
  Flame,
} from 'lucide-react';

interface HomeScreenProps {
  profile: Profile | null;
  todayGoal: Goal | undefined;
  monthGoal: Goal | undefined;
  streakCount: number;
  onNavigate: (route: string, state?: any) => void;
  onRefreshData: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  todayGoal,
  monthGoal,
  streakCount,
  onNavigate,
  onRefreshData,
}) => {
  const [showGoalModal, setShowGoalModal] = useState<Goal | null>(null);

  // Time-based greeting
  const now = new Date();
  const hour = now.getHours();
  let greetingTime = 'Morning';
  let ritualName = 'Sacred Morning Ritual';
  if (hour >= 12 && hour < 17) {
    greetingTime = 'Afternoon';
    ritualName = 'Sacred Midday Alignment';
  } else if (hour >= 17) {
    greetingTime = 'Evening';
    ritualName = 'Sacred Evening Reflection';
  }

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

  const handleMarkGoalDone = async (goal: Goal) => {
    setShowGoalModal(goal);
  };

  const handleConfirmGoalCompletion = async (achieved: boolean) => {
    if (!showGoalModal) return;

    if (achieved) {
      const updated: Goal = {
        ...showGoalModal,
        completedAt: new Date().toISOString(),
        status: 'completed',
        progressCurrent: showGoalModal.progressTarget || 1,
      };
      await saveGoal(updated);
    }
    setShowGoalModal(null);
    onRefreshData();
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Soul';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* PWA Install Banner */}
      <PWAInstallButton variant="prominent" />

      {/* Hero Welcome Card */}
      <section className="hero-gradient p-6 rounded-3xl shadow-xs border space-y-4 transition-all">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xs text-xs font-semibold text-accent shadow-2xs border border-black/5 dark:border-white/5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>{ritualName}</span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold hero-text flex items-center gap-2">
            <span>
              Good {greetingTime}, {firstName}
            </span>
            <span className="text-amber-400">✨</span>
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            {formattedDate}
          </p>
        </div>

        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span className="font-medium">Alignment: Grounded & Present</span>
          <span className="font-semibold text-accent flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Day {streakCount} Streak
          </span>
        </div>
      </section>

      {/* 2-Column Summary Cards: Today's Goal + Month's Goal */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Goal */}
        <div className="bg-white dark:bg-black p-5 rounded-3xl shadow-xs border border-black/5 dark:border-white/15 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-accent uppercase tracking-wider mb-2">
              <span>DAILY</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-bold text-base text-[#1b1b1c] dark:text-white">
              Today's Goal
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
              {todayGoal
                ? todayGoal.text
                : 'No active micro-intention set for today yet.'}
            </p>
          </div>

          <div>
            {todayGoal?.status === 'completed' ? (
              <div className="w-full py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>Achieved Today!</span>
              </div>
            ) : todayGoal ? (
              <button
                onClick={() => handleMarkGoalDone(todayGoal)}
                className="w-full py-2.5 rounded-full bg-accent text-on-accent font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover-bg-accent transition active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Mark Done</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('goals')}
                className="w-full py-2.5 rounded-full bg-accent text-on-accent font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover-bg-accent transition active:scale-95"
              >
                <span>Set Today's Goal</span>
              </button>
            )}
          </div>
        </div>

        {/* Month's Goal */}
        <div className="bg-white dark:bg-black p-5 rounded-3xl shadow-xs border border-black/5 dark:border-white/15 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-accent uppercase tracking-wider mb-2">
              <span>{monthName}</span>
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-bold text-base text-[#1b1b1c] dark:text-white">
              This Month's Goal
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
              {monthGoal
                ? monthGoal.text
                : 'No monthly milestone active. Hold a 30-day vision.'}
            </p>
          </div>

          <div>
            {monthGoal ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Progress</span>
                  <span>
                    {monthGoal.progressCurrent || 0} / {monthGoal.progressTarget || 30}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((monthGoal.progressCurrent || 0) / (monthGoal.progressTarget || 30)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('goals')}
                className="w-full py-2.5 rounded-full bg-accent text-on-accent font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover-bg-accent transition active:scale-95"
              >
                <span>Set Month's Goal</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#1b1b1c] dark:text-white px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('scripting')}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-3xl border border-black/5 dark:border-white/15 shadow-xs hover:border-accent-subtle transition group active:scale-95"
          >
            <div className="w-13 h-13 rounded-full bg-accent-container text-accent flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <PenTool className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-[#1b1b1c] dark:text-white">
              Write Script
            </span>
          </button>

          <button
            onClick={() => onNavigate('journal', { openNew: true })}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-3xl border border-black/5 dark:border-white/15 shadow-xs hover:border-accent-subtle transition group active:scale-95"
          >
            <div className="w-13 h-13 rounded-full bg-accent-container text-accent flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-[#1b1b1c] dark:text-white">
              New Journal
            </span>
          </button>

          <button
            onClick={() => onNavigate('album', { openCamera: true })}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-3xl border border-black/5 dark:border-white/15 shadow-xs hover:border-accent-subtle transition group active:scale-95"
          >
            <div className="w-13 h-13 rounded-full bg-accent-container text-accent flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Camera className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-[#1b1b1c] dark:text-white">
              Open Camera
            </span>
          </button>
        </div>
      </section>

      {/* Daily Affirmation Card Feature */}
      <DailyAffirmationCard onNavigate={onNavigate} />

      {/* Goal Completion Evaluation Dialog */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-black border border-black/5 dark:border-white/15 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-accent-container text-accent flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>

            <h3 className="font-bold text-lg text-[#1b1b1c] dark:text-white">
              Did you achieve it?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              "{showGoalModal.text}"
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleConfirmGoalCompletion(false)}
                className="py-3 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-black/5"
              >
                Not Yet (Extend)
              </button>
              <button
                onClick={() => handleConfirmGoalCompletion(true)}
                className="py-3 px-4 rounded-full bg-accent hover-bg-accent text-white font-semibold text-xs shadow-md active:scale-95 transition"
              >
                Yes, Manifested! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
