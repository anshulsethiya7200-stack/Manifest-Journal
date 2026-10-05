import React, { useState, useEffect, useRef } from 'react';
import { ScriptPage } from '../types';
import {
  getScriptPagesByDate,
  saveScriptPage,
  getStreak,
  updateScriptingStreak,
} from '../lib/storage';
import { sanitizeMultilineText } from '../lib/sanitize';
import {
  Flame,
  Sparkles,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface ScriptingScreenProps {
  initialState?: { prefillAffirmation?: string };
  onRefreshData?: () => void;
}

export const ScriptingScreen: React.FC<ScriptingScreenProps> = ({ initialState, onRefreshData }) => {
  const [pages, setPages] = useState<ScriptPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const loadData = async () => {
    const list = await getScriptPagesByDate(todayStr);
    const streak = await getStreak('scripting');
    setStreakCount(streak.count || 0);
    setIsCompletedToday(streak.lastDate === todayStr);

    if (list.length === 0) {
      // Clean blank page for today (or prefilled if coming from Daily Affirmation)
      const initialContent = initialState?.prefillAffirmation
        ? `${initialState.prefillAffirmation}\n\n`
        : '';
      const initial: ScriptPage = {
        id: crypto.randomUUID(),
        date: todayStr,
        page: 1,
        content: initialContent,
        sessionComplete: false,
        createdAt: new Date().toISOString(),
      };
      await saveScriptPage(initial);
      setPages([initial]);
      setCurrentPageIndex(0);
    } else {
      if (
        initialState?.prefillAffirmation &&
        list[0] &&
        !list[0].content.includes(initialState.prefillAffirmation)
      ) {
        const updated = {
          ...list[0],
          content: list[0].content
            ? `${list[0].content}\n\n${initialState.prefillAffirmation}`
            : `${initialState.prefillAffirmation}\n\n`,
        };
        await saveScriptPage(updated);
        setPages([updated, ...list.slice(1)]);
      } else {
        setPages(list);
      }
      setCurrentPageIndex(0);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentPage = pages[currentPageIndex];

  const handleContentChange = async (text: string) => {
    if (!currentPage) return;
    const updated: ScriptPage = { ...currentPage, content: text };
    const newPages = [...pages];
    newPages[currentPageIndex] = updated;
    setPages(newPages);
    await saveScriptPage(updated);
  };

  const handleAddPage = async () => {
    const newPageNum = pages.length + 1;
    const newPage: ScriptPage = {
      id: crypto.randomUUID(),
      date: todayStr,
      page: newPageNum,
      content: '',
      sessionComplete: false,
      createdAt: new Date().toISOString(),
    };
    await saveScriptPage(newPage);
    const updated = [...pages, newPage];
    setPages(updated);
    setCurrentPageIndex(updated.length - 1);
  };

  const handleCompleteSession = async () => {
    const newStreak = await updateScriptingStreak(todayStr);
    setStreakCount(newStreak);
    setIsCompletedToday(true);
    setShowCelebration(true);
    onRefreshData?.();
    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Streak Top Banner */}
      <div className="streak-gradient p-4 rounded-3xl flex items-center justify-between border border-black/5 dark:border-white/5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-black/40 flex items-center justify-center text-amber-500 shadow-xs">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm hero-text">
              {streakCount} Day Streak!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Scripting reality daily with focus
            </p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      {/* Notebook Writing Pad */}
      <div className="rounded-3xl shadow-sm border border-slate-200 dark:border-white/15 overflow-hidden bg-white dark:bg-black">
        {/* Notebook Top Margin Line & Header */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200 dark:border-white/15 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider bg-white/50 dark:bg-black">
          <span>PRESENT MOMENT AFFIRMATION</span>
          <span className="normal-case">Today, {nowTime}</span>
        </div>

        {/* Notebook Lined Content Area */}
        <div className="notebook-ruled-paper pl-2 pr-3 pt-0 pb-4 min-h-[360px] relative">
          <textarea
            value={currentPage?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your reality into being as if it has already occurred in the present moment..."
            className="w-full h-full min-h-[340px] bg-transparent resize-none border-none outline-hidden text-slate-900 dark:text-white dark:placeholder:text-slate-400 font-medium text-base leading-[32px] tracking-wide p-0 m-0"
            style={{ lineHeight: '32px', paddingTop: '7px' }}
          />
        </div>

        {/* Bottom Page Navigation & Complete Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-white/15 flex items-center justify-between gap-2">
          {/* Page indicator & pagination */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-full text-slate-500 hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <button
              disabled={currentPageIndex === pages.length - 1}
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="p-1 rounded-full text-slate-500 hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Page Button */}
            <button
              onClick={handleAddPage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-accent-container text-accent text-xs font-bold transition active:scale-95 shadow-2xs hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>

            {/* Complete Session Button */}
            <button
              onClick={handleCompleteSession}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition active:scale-95 shadow-xs ${
                isCompletedToday
                  ? 'bg-emerald-600 text-white'
                  : 'bg-accent hover-bg-accent text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isCompletedToday ? `Goal ${streakCount} ✓` : `Goal ${streakCount}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Celebration Toast */}
      {showCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-accent text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in zoom-in-95">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span>Sacred Script Anchored! Streak +1</span>
        </div>
      )}

      {/* Guidance Note */}
      <div className="bg-[#f0f4ff]/50 dark:bg-black p-4 rounded-2xl border border-black/5 dark:border-white/15 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          The Sacred Scripting Rule:
        </p>
        <p>
          Write exclusively in the present tense ("I am", "I receive", "I embody"). Never write "I want" or "I wish", as longing reinforces the frequency of lack. Feel the emotional frequency of completion as your words touch the screen.
        </p>
      </div>
    </div>
  );
};
