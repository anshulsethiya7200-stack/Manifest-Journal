import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ICONS_DIR = '/public/icons';
fs.mkdirSync(ICONS_DIR, { recursive: true });

// High-resolution SVG of the Manifest Journal logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1954f5" />
      <stop offset="45%" stop-color="#0b3cd6" />
      <stop offset="100%" stop-color="#061f96" />
    </linearGradient>

    <!-- Star Glow -->
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8b3" stop-opacity="1" />
      <stop offset="50%" stop-color="#ffd54f" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#ffb300" stop-opacity="0" />
    </radialGradient>

    <!-- Golden Star Gradient -->
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffde7" />
      <stop offset="50%" stop-color="#ffea00" />
      <stop offset="100%" stop-color="#f57f17" />
    </linearGradient>

    <!-- Subtle Book Shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#020e40" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="url(#bgGrad)" />

  <!-- Inner Ambient Glow Ring -->
  <rect x="20" y="20" width="472" height="472" rx="108" ry="108" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.3" />

  <!-- 4-Point Manifestation Star -->
  <circle cx="256" cy="148" r="54" fill="url(#starGlow)" opacity="0.6" />
  <path d="M 256,92 Q 256,148 312,148 Q 256,148 256,204 Q 256,148 200,148 Q 256,148 256,92 Z" fill="url(#starGrad)" />

  <!-- Open White Journal Pages -->
  <g filter="url(#shadow)">
    <!-- Left Page -->
    <path d="M 96,252 C 140,240 210,246 250,264 L 250,404 C 210,388 140,380 96,396 Z" fill="#ffffff" />
    <!-- Left Page Ruled Lines -->
    <line x1="130" y1="290" x2="225" y2="290" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />
    <line x1="130" y1="322" x2="225" y2="322" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />
    <line x1="130" y1="354" x2="205" y2="354" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />

    <!-- Right Page -->
    <path d="M 262,264 C 302,246 372,240 416,252 L 416,396 C 372,380 302,388 262,404 Z" fill="#ffffff" />
    
    <!-- Pen on Right Page -->
    <g transform="rotate(-15 345 320)">
      <rect x="338" y="272" width="14" height="74" rx="7" fill="#0b3cd6" />
      <!-- Pen Tip -->
      <polygon points="338,346 352,346 345,364" fill="#0b3cd6" />
      <polygon points="343,360 347,360 345,364" fill="#ffea00" />
      <!-- Pen Clip -->
      <line x1="337" y1="282" x2="337" y2="304" stroke="#60a5fa" stroke-width="4" stroke-linecap="round" />
    </g>

    <!-- Center Book Spine Crease -->
    <path d="M 250,264 Q 256,267 262,264 L 262,404 Q 256,410 250,404 Z" fill="#e2e8f0" />
  </g>
</svg>`;

const svgPath = path.join(ICONS_DIR, 'icon.svg');
fs.writeFileSync(svgPath, svgContent);
fs.writeFileSync('/public/icon.svg', svgContent);

// Maskable SVG with 15% safe padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1954f5" />
      <stop offset="100%" stop-color="#061f96" />
    </linearGradient>
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffde7" />
      <stop offset="100%" stop-color="#ffb300" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgGrad)" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <circle cx="256" cy="148" r="54" fill="#ffea00" opacity="0.3" />
    <path d="M 256,92 Q 256,148 312,148 Q 256,148 256,204 Q 256,148 200,148 Q 256,148 256,92 Z" fill="url(#starGrad)" />
    <path d="M 96,252 C 140,240 210,246 250,264 L 250,404 C 210,388 140,380 96,396 Z" fill="#ffffff" />
    <line x1="130" y1="290" x2="225" y2="290" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />
    <line x1="130" y1="322" x2="225" y2="322" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />
    <line x1="130" y1="354" x2="205" y2="354" stroke="#8da8f6" stroke-width="7" stroke-linecap="round" />
    <path d="M 262,264 C 302,246 372,240 416,252 L 416,396 C 372,380 302,388 262,404 Z" fill="#ffffff" />
    <g transform="rotate(-15 345 320)">
      <rect x="338" y="272" width="14" height="74" rx="7" fill="#0b3cd6" />
      <polygon points="338,346 352,346 345,364" fill="#0b3cd6" />
    </g>
    <path d="M 250,264 Q 256,267 262,264 L 262,404 Q 256,410 250,404 Z" fill="#e2e8f0" />
  </g>
</svg>`;
const maskableSvgPath = path.join(ICONS_DIR, 'icon-maskable.svg');
fs.writeFileSync(maskableSvgPath, maskableSvg);

// Sizes to generate
const sizes = [
  { name: 'icon-48.png', size: 48, src: svgPath },
  { name: 'icon-72.png', size: 72, src: svgPath },
  { name: 'icon-96.png', size: 96, src: svgPath },
  { name: 'icon-128.png', size: 128, src: svgPath },
  { name: 'icon-192.png', size: 192, src: svgPath },
  { name: 'icon-512.png', size: 512, src: svgPath },
  { name: 'badge-72.png', size: 72, src: svgPath },
  { name: 'shortcut-journal.png', size: 192, src: svgPath },
  { name: 'shortcut-script.png', size: 192, src: svgPath },
  { name: 'shortcut-goals.png', size: 192, src: svgPath },
  { name: 'icon-maskable-192.png', size: 192, src: maskableSvgPath },
  { name: 'icon-maskable-512.png', size: 512, src: maskableSvgPath },
];

for (const item of sizes) {
  const dest = path.join(ICONS_DIR, item.name);
  try {
    execSync(`convert -background none -resize ${item.size}x${item.size} "${item.src}" "${dest}"`);
  } catch (err) {
    console.error(`Failed to convert ${item.name}`, err);
  }
}

// Apple touch icon 180x180
try {
  execSync(`convert -background none -resize 180x180 "${svgPath}" "/public/apple-touch-icon.png"`);
  execSync(`convert -background none -resize 192x192 "${svgPath}" "/public/pwa-192x192.png"`);
  execSync(`convert -background none -resize 512x512 "${svgPath}" "/public/pwa-512x512.png"`);
  execSync(`convert -background none -resize 512x512 "${maskableSvgPath}" "/public/pwa-maskable-512x512.png"`);
} catch (e) {
  console.error('Failed apple touch icon', e);
}

console.log('Icons generated successfully!');
