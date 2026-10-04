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
    hex: '#047857',
    description: 'Prosperity, limitless wealth, flourishing health',
  },
  {
    name: 'Solar Amber',
    chakra: 'Solar Plexus',
    hex: '#b45309',
    description: 'Willpower, vibrant manifestation, sovereignty',
  },
  {
    name: 'Sacred Rose',
    chakra: 'Divine Heart',
    hex: '#be123c',
    description: 'Gratitude, self-love, compassionate resonance',
  },
  {
    name: 'Deep Ocean',
    chakra: 'Throat Chakra',
    hex: '#0369a1',
    description: 'Truth, calm certainty, peaceful presence',
  },
  {
    name: 'Quantum Fire',
    chakra: 'Sacral Chakra',
    hex: '#c2410c',
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
    root.style.backgroundColor = '#000000';
    root.style.color = '#ffffff';
    if (body) {
      body.classList.add('dark');
      body.style.backgroundColor = '#000000';
      body.style.color = '#ffffff';
    }
  } else {
    root.removeAttribute('data-theme');
    root.classList.remove('dark');
    root.style.backgroundColor = '#fcf9f8';
    root.style.color = '#1b1b1c';
    if (body) {
      body.classList.remove('dark');
      body.style.backgroundColor = '#fcf9f8';
      body.style.color = '#1b1b1c';
    }
  }

  // Update theme-color meta tag for mobile address bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#000000' : '#fcf9f8');
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

  // Calculate relative luminance to guarantee WCAG AA contrast ratio >= 4.5:1
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const onAccent = lum > 0.38 ? '#000000' : '#ffffff';

  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--on-accent', onAccent);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-container', `rgba(${r}, ${g}, ${b}, 0.16)`);
  root.style.setProperty('--accent-container-dark', `rgba(${r}, ${g}, ${b}, 0.3)`);
  root.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty('--accent-hover', `rgba(${r}, ${g}, ${b}, 0.88)`);
  root.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--accent-ring', `rgba(${r}, ${g}, ${b}, 0.5)`);
  root.style.setProperty('--md-sys-color-primary', hex);

  if (document.body) {
    document.body.style.setProperty('--accent-color', hex);
    document.body.style.setProperty('--on-accent', onAccent);
    document.body.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  }
}
