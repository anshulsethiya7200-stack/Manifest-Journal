// src/lib/theme.ts — Comprehensive Theme and Sacred Accent Color System

export interface SacredAccent {
  name: string;
  chakra: string;
  hex: string;
  description: string;
}

export const SACRED_ACCENT_COLORS: SacredAccent[] = [
  {
    name: 'Cosmic Indigo',
    chakra: 'Third Eye',
    hex: '#0b57d0',
    description: 'Higher vision, clear clarity, cosmic alignment',
  },
  {
    name: 'Mystic Violet',
    chakra: 'Crown Chakra',
    hex: '#7c3aed',
    description: 'Spiritual connection, intuition, sacred wisdom',
  },
  {
    name: 'Abundance Emerald',
    chakra: 'Heart Chakra',
    hex: '#059669',
    description: 'Prosperity, limitless wealth, flourishing health',
  },
  {
    name: 'Solar Amber',
    chakra: 'Solar Plexus',
    hex: '#d97706',
    description: 'Willpower, vibrant manifestation, sovereignty',
  },
  {
    name: 'Sacred Rose',
    chakra: 'Divine Heart',
    hex: '#e11d48',
    description: 'Gratitude, self-love, compassionate resonance',
  },
  {
    name: 'Deep Ocean',
    chakra: 'Throat Chakra',
    hex: '#0284c7',
    description: 'Truth, calm certainty, peaceful presence',
  },
  {
    name: 'Quantum Fire',
    chakra: 'Sacral Chakra',
    hex: '#ea580c',
    description: 'Creative fire, dynamic breakthrough, magnetism',
  },
  {
    name: 'Obsidian Void',
    chakra: 'Root Chakra',
    hex: '#334155',
    description: 'Grounding, protection, unshakeable sanctuary',
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 11, g: 87, b: 208 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Apply the appearance mode (light, dark, or system) to the document
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): boolean {
  if (typeof document === 'undefined') return false;

  let isDark = false;
  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'light') {
    isDark = false;
  } else {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
    if (body) {
      body.classList.add('dark');
      body.style.backgroundColor = '#111318';
      body.style.color = '#e2e2e9';
    }
  } else {
    root.removeAttribute('data-theme');
    root.classList.remove('dark');
    if (body) {
      body.classList.remove('dark');
      body.style.backgroundColor = '#fcf9f8';
      body.style.color = '#1b1b1c';
    }
  }

  // Update theme-color meta tag for mobile address bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#111318' : '#fcf9f8');
  }

  return isDark;
}

/**
 * Apply the Sacred Accent Color dynamically across all CSS variables
 */
export function applyAccentColor(accentColorHex: string) {
  if (typeof document === 'undefined') return;

  const hex = accentColorHex || '#0b57d0';
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement;

  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-container', `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.style.setProperty('--accent-container-dark', `rgba(${r}, ${g}, ${b}, 0.28)`);
  root.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty('--accent-hover', `rgba(${r}, ${g}, ${b}, 0.88)`);
  root.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--accent-ring', `rgba(${r}, ${g}, ${b}, 0.45)`);
  root.style.setProperty('--md-sys-color-primary', hex);
}
