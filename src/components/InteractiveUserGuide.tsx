// src/components/InteractiveUserGuide.tsx — Interactive Step-by-Step Animated User Guide
import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  PenTool,
  Tv,
  Palette,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Check,
} from 'lucide-react';

interface InteractiveUserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const InteractiveUserGuide: React.FC<InteractiveUserGuideProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const guideSteps = [
    {
      title: 'Sacred Manifestation Philosophy',
      badge: 'Core Foundation',
      icon: Sparkles,
      route: 'knowledge',
      description:
        'Manifest Journal is engineered around neuroscience and intentional embodiment. By engaging the Reticular Activating System (RAS) through daily emotional focus, you train your brain to filter and prioritize opportunities aligned with your highest vision.',
      tips: [
        'Write in the present tense ("I am", "I create") rather than longing.',
        'Emotion precedes outcome: Feel the certainty and peace first.',
        'Zero cloud tracking: 100% of your sacred thoughts stay on your device.',
      ],
    },
    {
      title: 'The Sacred Identity Covenant',
      badge: 'Sacred Seal',
      icon: FileCheck,
      route: 'commitment',
      description:
        'Before etching your intentions, you seal a personal covenant. You record your authentic identity, state your binding pledge, assign a mandatory quitting clause if you abandon your goals, and sign your signature canvas.',
      tips: [
        'Take a live selfie or upload your profile portrait.',
        'Read your vow aloud with speech synthesis to anchor it.',
        'Review your sealed vow anytime in Settings.',
      ],
    },
    {
      title: 'Multi-Horizon Intentions & Milestones',
      badge: 'Laser Focus',
      icon: Target,
      route: 'goals',
      description:
        'Bridge present micro-actions with your 10-year legacy. Manage 5 distinct manifestation horizons: Today, Month (30d), Year (365d), 5-Year, and 10-Year horizons with real-time countdown countdowns.',
      tips: [
        'Daily micro-intentions prevent overwhelming mental clutter.',
        'When a deadline arrives, evaluate if you achieved it or need to extend.',
        'Mark goals done to build momentum and inner confidence.',
      ],
    },
    {
      title: 'The 3-6-9 Sacred Scripting Notebook',
      badge: 'Subconscious Reprogramming',
      icon: PenTool,
      route: 'scripting',
      description:
        'Practice Nikola Tesla’s legendary 3-6-9 method on a tactile ruled notebook paper interface. Write your intention 3 times in the morning, 6 times in the afternoon, and 9 times before sleep.',
      tips: [
        'Multi-page notebook with auto-saved local persistence.',
        'Track daily scripting streaks that reward consistent discipline.',
        'Tap "Script This" on any daily affirmation to populate your page.',
      ],
    },
    {
      title: 'Spoken Teleprompter with Camera',
      badge: 'Vocal Certainty',
      icon: Tv,
      route: 'teleprompter',
      description:
        'Speak your affirmations directly into your camera lens at eye-level. The auto-scrolling teleprompter is pinned to the absolute top of the viewport adjacent to the camera so your eye contact remains unwavering.',
      tips: [
        'Recalibrated smooth scrolling starting at a comfortably slow 0.5x pace.',
        'Real-time highlighted words pulse as you speak.',
        'Recordings save safely to your private local Album.',
      ],
    },
    {
      title: 'Appearance Mode & Sacred Frequencies',
      badge: 'Energetic Resonance',
      icon: Palette,
      route: 'settings',
      description:
        'Customize your visual temple. Switch between Obsidian Black Night and Day Clarity, and select from 8 Sacred Manifestation Frequencies aligned with the Chakras to color your buttons, hero text, and badges.',
      tips: [
        'Obsidian Black turns backgrounds and elements into pure black.',
        'Buttons and hero headings dynamically adopt your sacred frequency.',
        'Export your entire vault anytime as an offline .zip archive.',
      ],
    },
  ];

  const step = guideSteps[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === guideSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleTryNow = () => {
    onClose();
    if (onNavigate && step.route) {
      onNavigate(step.route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-black border border-black/10 dark:border-white/15 p-6 sm:p-7 shadow-2xl text-left space-y-5 relative overflow-hidden transition-all">
        {/* Top ambient aura in dark mode */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Badge & Close */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-accent-container text-accent flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 text-accent" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                Interactive Journey Guide
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Step {currentStep + 1} of {guideSteps.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden relative z-10">
          <div
            className="bg-accent h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
          />
        </div>

        {/* Main Content Body */}
        <div className="space-y-4 relative z-10 min-h-[220px]">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent-container text-accent flex items-center justify-center shrink-0 shadow-xs">
              <StepIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent-subtle mb-1">
                {step.badge}
              </span>
              <h3 className="text-xl font-extrabold hero-text leading-tight">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Key Tips */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Core Principles:
            </span>
            <ul className="space-y-1.5">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="py-2.5 px-3.5 rounded-full border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleTryNow}
              className="py-2.5 px-3.5 rounded-full bg-accent-container text-accent border border-accent-subtle text-xs font-bold hover:opacity-90 transition active:scale-95"
            >
              Try This Now
            </button>
          </div>

          <button
            onClick={handleNext}
            className="py-2.5 px-5 rounded-full bg-accent hover-bg-accent text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <span>{isLast ? 'Complete Guide' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
