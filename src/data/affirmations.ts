// src/data/affirmations.ts — Curated positive, goal-orientated daily affirmations and quotes stored locally

export interface DailyAffirmation {
  id: string;
  quote: string;
  category: 'Goal Realization' | 'Relentless Focus' | 'Abundance & Wealth' | 'Courage & Action' | 'Inner Mastery' | 'Quantum Momentum';
  source?: string;
  focusIntent: string;
}

export const PREDEFINED_AFFIRMATIONS: DailyAffirmation[] = [
  {
    id: 'aff-1',
    quote: 'Every intentional step I take today compounds into extraordinary, lasting breakthroughs.',
    category: 'Goal Realization',
    source: 'Intention Principle',
    focusIntent: 'Compounding daily effort toward your master vision.',
  },
  {
    id: 'aff-2',
    quote: 'I do not chase my goals; I cultivate the discipline, energy, and certainty that magnetically draws them in.',
    category: 'Quantum Momentum',
    source: 'Law of Resonance',
    focusIntent: 'Embodying the state of already having achieved your aim.',
  },
  {
    id: 'aff-3',
    quote: 'My mind is razor-sharp and free of distraction. Today, my highest priority receives my absolute best energy.',
    category: 'Relentless Focus',
    source: 'Deep Work Mastery',
    focusIntent: 'Protecting your focus from trivial distractions.',
  },
  {
    id: 'aff-4',
    quote: 'Obstacles are not barricades; they are the exact raw material forge from which my strength and capability are shaped.',
    category: 'Courage & Action',
    source: 'Stoic Alignment',
    focusIntent: 'Transforming resistance into forward acceleration.',
  },
  {
    id: 'aff-5',
    quote: 'I welcome boundless abundance into my work, my finances, and my relationships with grounded gratitude.',
    category: 'Abundance & Wealth',
    source: 'Universal Flow',
    focusIntent: 'Opening your awareness to prosperity and mutual value.',
  },
  {
    id: 'aff-6',
    quote: 'The future I desire is not somewhere out there in time—it is created through the standard of excellence I maintain right now.',
    category: 'Goal Realization',
    source: 'Present Moment Power',
    focusIntent: 'Showing up at your highest standard in this waking moment.',
  },
  {
    id: 'aff-7',
    quote: 'I release all hesitation, imposter doubt, and perfectionism. Decisive action is the antidote to fear.',
    category: 'Courage & Action',
    source: 'Action Philosophy',
    focusIntent: 'Moving forward with bold, steady clarity.',
  },
  {
    id: 'aff-8',
    quote: 'My capacity to create value expands every single day. I am worthy of the extraordinary milestones I have envisioned.',
    category: 'Inner Mastery',
    source: 'Self-Worth Architecture',
    focusIntent: 'Anchoring unshakeable self-trust and confidence.',
  },
  {
    id: 'aff-9',
    quote: 'Consistency is my superpower. Small, unglamorous daily habits build castles that outlast temporary motivation.',
    category: 'Goal Realization',
    source: 'Habit Mastery',
    focusIntent: 'Honoring daily commitments without compromise.',
  },
  {
    id: 'aff-10',
    quote: 'I am tranquil in spirit, unshakeable in focus, and fiercely committed to my sacred covenant.',
    category: 'Inner Mastery',
    source: 'Inner Poise',
    focusIntent: 'Maintaining peace while pursuing ambitious horizons.',
  },
  {
    id: 'aff-11',
    quote: 'Opportunities flow seamlessly toward my clear, unambiguous intentions. What I seek is actively seeking me.',
    category: 'Quantum Momentum',
    source: 'Rumi Wisdom',
    focusIntent: 'Trusting divine synchronicity and right timing.',
  },
  {
    id: 'aff-12',
    quote: 'Today, I refuse to trade long-term legacy for short-term comfort. I choose the path of enduring fulfillment.',
    category: 'Relentless Focus',
    source: 'Legacy Mindset',
    focusIntent: 'Prioritizing what matters over what is convenient.',
  },
  {
    id: 'aff-13',
    quote: 'My energy is sacred. I invest it solely in thoughts, people, and projects that elevate my soul and multiply my impact.',
    category: 'Inner Mastery',
    source: 'Energetic Sovereignty',
    focusIntent: 'Guarding your vital life force with precision.',
  },
  {
    id: 'aff-14',
    quote: 'Financial freedom and creative fulfillment coexist harmoniously in my journey. Wealth is the natural byproduct of the value I provide.',
    category: 'Abundance & Wealth',
    source: 'Abundance Economics',
    focusIntent: 'Aligning service and contribution with sustainable wealth.',
  },
  {
    id: 'aff-15',
    quote: 'I am not defined by yesterday’s delays or setbacks. Today is a clean, sovereign canvas waiting for my deliberate signature.',
    category: 'Courage & Action',
    source: 'Renewal Principle',
    focusIntent: 'Stepping into today with renewed vigor and optimism.',
  },
  {
    id: 'aff-16',
    quote: 'The vision I carry was placed in my heart for a reason. I have everything required within me to bring it into tangible form.',
    category: 'Goal Realization',
    source: 'Creative Purpose',
    focusIntent: 'Validating your dreams through disciplined realization.',
  },
  {
    id: 'aff-17',
    quote: 'Clear decisions cut through mental fatigue. I decide with conviction, execute with grace, and adjust with wisdom.',
    category: 'Relentless Focus',
    source: 'Executive Clarity',
    focusIntent: 'Eliminating ambiguity through decisive action.',
  },
  {
    id: 'aff-18',
    quote: 'I am in complete rhythm with the universe. Effortless flow replaces forced striving as I align with my true purpose.',
    category: 'Quantum Momentum',
    source: 'Taoist Harmony',
    focusIntent: 'Relaxing into effortless flow while staying productive.',
  },
  {
    id: 'aff-19',
    quote: 'My daily rituals are non-negotiable anchors. They protect my peace, amplify my creativity, and guarantee my elevation.',
    category: 'Goal Realization',
    source: 'Ritual Discipline',
    focusIntent: 'Honoring your morning and evening rituals.',
  },
  {
    id: 'aff-20',
    quote: 'I radiate gratitude for what is already present, and enthusiastic expectancy for the quantum leaps preparing to manifest.',
    category: 'Abundance & Wealth',
    source: 'Gratitude Magnetism',
    focusIntent: 'Combining appreciation with bold aspiration.',
  },
  {
    id: 'aff-21',
    quote: 'Courage is not the absence of doubt; it is the decision that my vision matters far more than my comfort.',
    category: 'Courage & Action',
    source: 'Brave Action',
    focusIntent: 'Transcending comfort zones to touch greatness.',
  },
  {
    id: 'aff-22',
    quote: 'I cultivate a fortress of internal calm. No external noise can disturb the sacred sanctuary of my concentrated mind.',
    category: 'Inner Mastery',
    source: 'Mind Fortress',
    focusIntent: 'Staying centered amidst external chaos.',
  },
  {
    id: 'aff-23',
    quote: 'Every goal I set has already happened in the realm of possibility. My only job today is to walk the bridge of action.',
    category: 'Quantum Momentum',
    source: 'Neville Goddard Teachings',
    focusIntent: 'Assuming the feeling of the wish fulfilled.',
  },
  {
    id: 'aff-24',
    quote: 'I celebrate the incremental wins. Each micro-step completed today cements my identity as a finisher.',
    category: 'Goal Realization',
    source: 'Identity Architecture',
    focusIntent: 'Celebrating progress and reinforcing self-integrity.',
  },
];

/**
 * Returns a stable, deterministic daily affirmation based on the calendar date.
 * If the user refreshes within the same day, they see the exact same quote.
 */
export function getDailyAffirmation(dateStr?: string): DailyAffirmation {
  const dateKey = dateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PREDEFINED_AFFIRMATIONS.length;
  return PREDEFINED_AFFIRMATIONS[index];
}

/**
 * Returns a random affirmation excluding the current one if specified.
 */
export function getRandomAffirmation(currentId?: string): DailyAffirmation {
  const pool = currentId
    ? PREDEFINED_AFFIRMATIONS.filter((a) => a.id !== currentId)
    : PREDEFINED_AFFIRMATIONS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || PREDEFINED_AFFIRMATIONS[0];
}
