// src/components/DailyAffirmationCard.tsx — Feature component for displaying daily positive goal-oriented quotes

import React, { useState, useEffect } from 'react';
import { DailyAffirmation, getDailyAffirmation, getRandomAffirmation } from '../data/affirmations';
import {
  Sparkles,
  Shuffle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  PenTool,
  BookOpen,
  Quote,
} from 'lucide-react';

interface DailyAffirmationCardProps {
  onNavigate: (route: string, state?: any) => void;
}

export const DailyAffirmationCard: React.FC<DailyAffirmationCardProps> = ({ onNavigate }) => {
  const [affirmation, setAffirmation] = useState<DailyAffirmation>(() => getDailyAffirmation());
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Initialize or re-evaluate on calendar day change
  useEffect(() => {
    setAffirmation(getDailyAffirmation());
  }, []);

  // Stop speech if unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleShuffle = () => {
    setIsShuffling(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setTimeout(() => {
      const next = getRandomAffirmation(affirmation.id);
      setAffirmation(next);
      setIsShuffling(false);
    }, 200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${affirmation.quote}" — ${affirmation.source || 'Manifest Journal'}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(affirmation.quote);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleScriptAffirmation = () => {
    onNavigate('scripting', {
      prefillAffirmation: affirmation.quote,
    });
  };

  const handleJournalReflection = () => {
    onNavigate('journal', {
      openNew: true,
      prefill: `Daily Affirmation Reflection:\n"${affirmation.quote}"\n\nFocus Intent: ${affirmation.focusIntent}\n\nHow I will embody this today:\n`,
    });
  };

  return (
    <section className="card-gradient relative overflow-hidden p-6 rounded-3xl border shadow-xs space-y-4 transition-all">
      {/* Subtle background decorative quote watermark */}
      <div className="absolute -top-3 -right-2 text-slate-100 dark:text-white/[0.04] pointer-events-none select-none">
        <Quote className="w-24 h-24 stroke-[1]" />
      </div>

      {/* Top Header Badge Row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-container text-accent text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Affirmation</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
            {affirmation.category}
          </span>
        </div>

        {/* Action Controls: Shuffle, Audio, Copy */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSpeak}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
              isSpeaking
                ? 'bg-accent text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title={isSpeaking ? 'Mute affirmation' : 'Listen aloud'}
            aria-label={isSpeaking ? 'Mute affirmation' : 'Listen aloud'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95"
            title={isCopied ? 'Copied to clipboard' : 'Copy quote'}
            aria-label={isCopied ? 'Copied to clipboard' : 'Copy quote'}
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleShuffle}
            disabled={isShuffling}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95 disabled:opacity-50"
            title="Draw another affirmation"
            aria-label="Draw another affirmation"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quote Display */}
      <div className={`space-y-2 relative z-10 transition-opacity duration-200 ${isShuffling ? 'opacity-40' : 'opacity-100'}`}>
        <blockquote className="text-base sm:text-lg font-serif italic leading-relaxed text-[#001d35] dark:text-white">
          "{affirmation.quote}"
        </blockquote>

        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-medium">
            Focus: <span className="text-slate-700 dark:text-slate-300 font-semibold">{affirmation.focusIntent}</span>
          </span>
          {affirmation.source && (
            <span className="font-mono text-[10px] text-slate-400">
              — {affirmation.source}
            </span>
          )}
        </div>
      </div>

      {/* Direct Action Buttons: Script It & Reflect in Journal */}
      <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5 relative z-10">
        <button
          onClick={handleScriptAffirmation}
          className="flex-1 py-2.5 px-3 rounded-full bg-accent text-white hover-bg-accent text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Script This</span>
        </button>

        <button
          onClick={handleJournalReflection}
          className="flex-1 py-2.5 px-3 rounded-full bg-accent-container text-accent border border-accent-subtle hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Journal Reflection</span>
        </button>
      </div>
    </section>
  );
};
