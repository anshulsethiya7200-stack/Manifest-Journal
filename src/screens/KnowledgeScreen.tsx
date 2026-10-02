import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Flame,
  CheckCircle,
  Compass,
} from 'lucide-react';

interface VideoCard {
  title: string;
  channelName: string;
  url: string;
  thumbnailId: string;
  duration: string;
}

const YOUTUBE_VIDEOS: VideoCard[] = [
  {
    title: 'The Science of Manifestation: Reticular Activating System',
    channelName: 'Dr. Andrew Huberman & Neurobiology',
    url: 'https://www.youtube.com/watch?v=0hN1wM0M0eQ',
    thumbnailId: 'huberman-ras',
    duration: '18 min',
  },
  {
    title: 'The Secret Power of the 3-6-9 Code by Nikola Tesla',
    channelName: 'Conscious Elevation',
    url: 'https://www.youtube.com/watch?v=kYJ40-QnE_0',
    thumbnailId: 'tesla-369',
    duration: '14 min',
  },
  {
    title: 'Living in the End: Neville Goddard Assumption Technique',
    channelName: 'Master Sri Akarshana',
    url: 'https://www.youtube.com/watch?v=Nq32d0_M914',
    thumbnailId: 'neville-goddard',
    duration: '22 min',
  },
  {
    title: 'Rewiring the Subconscious Mind for Wealth & Self-Worth',
    channelName: 'Dr. Joe Dispenza Insights',
    url: 'https://www.youtube.com/watch?v=2Z20bX5vF6g',
    thumbnailId: 'dispenza-subconscious',
    duration: '26 min',
  },
];

interface KnowledgeScreenProps {
  onOpenGuide?: () => void;
}

export const KnowledgeScreen: React.FC<KnowledgeScreenProps> = ({ onOpenGuide }) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const sections = [
    {
      title: '1. What is Manifestation?',
      icon: Sparkles,
      content: `Manifestation is the conscious act of aligning thoughts, emotions, language, and physical actions with a specific desired reality so that it collapses into tangible experience. 
      
It is not passive daydreaming or wishful thinking; it is an active discipline of neural reprogramming and somatic embodiment. By consistently sustaining the emotional frequency of your desired outcome before it physically appears, you recalibrate your perceptual filters and decision-making architecture.`,
    },
    {
      title: '2. Why It Works (Neuroscience & Physics)',
      icon: Brain,
      content: `The Reticular Activating System (RAS) in your brainstem filters over 2 million bits of incoming sensory data every second down to roughly 120 bits. When you write or speak an intention with emotional gravity, your RAS tags that subject as critical for survival and prosperity.
      
Suddenly, opportunities, serendipitous connections, and creative solutions that were previously invisible enter your immediate awareness. At a subconscious level, neuroplasticity forms permanent myelin-sheathed pathways matching your new self-image.`,
    },
    {
      title: '3. The 3-6-9 Nikola Tesla Method',
      icon: Zap,
      content: `Nikola Tesla famously noted: "If you only knew the magnificence of the 3, 6, and 9, then you would have the key to the universe."

The 3-6-9 Scripting Ritual:
• Morning (3 Times): Within 15 minutes of waking, write your core affirmation 3 times in the present tense. This plants the seed in the hypnopompic brainwave state.
• Afternoon (6 Times): Around midday, pause and write the intention 6 times to amplify and reinforce alignment amidst the day's tasks.
• Evening (9 Times): Before sleep, write the intention 9 times to anchor it into the subconscious mind as it enters the theta state during sleep.`,
    },
    {
      title: '4. Sacred Rules of Manifestation',
      icon: Flame,
      content: `Rule 1: Present Tense Only. Write "I am", "I enjoy", "I create". Longing ("I want") only reinforces lack.
      
Rule 2: Emotion Precedes Outcome. Feel the relief, joy, or quiet certainty of the result right now.
      
Rule 3: Non-Attachment to the "How". Hold the destination with iron certainty, but give reality absolute flexibility in how it organizes the path.
      
Rule 4: Relentless Micro-Action. Pair your spiritual alignment with daily disciplined actions. The universe rewards motion.`,
    },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold hero-text">
          Know to Manifest
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          The scientific laws, ancient principles, and disciplined mechanics of conscious reality creation.
        </p>
      </div>

      {/* Interactive Guide Banner */}
      {onOpenGuide && (
        <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-container text-accent flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
                Interactive Journey Guide
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Step-by-step walkthrough of core philosophy & features.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenGuide}
            className="px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-bold shrink-0 shadow-xs transition active:scale-95"
          >
            Start Tour
          </button>
        </div>
      )}

      {/* Accordion Guide Sections */}
      <div className="space-y-3">
        {sections.map((sec, idx) => {
          const isExpanded = expandedSection === idx;
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-black rounded-3xl border border-black/5 dark:border-white/15 shadow-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent-container text-accent flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white group-hover:text-accent transition">
                    {sec.title}
                  </h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-white/10">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Curated YouTube Video Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#1b1b1c] dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Curated Teachings</span>
          </h3>
          <span className="text-[11px] text-slate-400">External Links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {YOUTUBE_VIDEOS.map((vid, i) => (
            <a
              key={i}
              href={vid.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-black p-4 rounded-3xl border border-black/5 dark:border-white/15 shadow-xs hover:border-accent-subtle transition group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-[#1b1b1c] dark:text-white group-hover:text-accent transition line-clamp-2">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {vid.channelName}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-accent shrink-0" />
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                  {vid.duration}
                </span>
                <span className="text-accent font-semibold">
                  Watch on YouTube →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
