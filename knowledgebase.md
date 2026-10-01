# Manifest Journal — Knowledgebase

## Overview
"Manifest Journal" is a local-first, privacy-first Progressive Web App (PWA) designed to help individuals practice intentional living through structured journaling, multi-horizon goal setting, manifestation techniques (3-6-9 method, scripting, affirmations), multimedia capture, and a teleprompter for spoken affirmations.
Zero backend, zero authentication, zero server. 100% of user data lives in the user's browser.

---

## Core Architecture & Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Environment & Runtime Resilience**:
  - `window.fetch` Accessor Shim (`index.html`): Configured custom accessor property descriptors on `window` and `Window.prototype` providing both getter and setter for `fetch`. This resolves the TypeError (`Cannot set property fetch of #<Window> which has only a getter`) encountered when iframe host environments or proxies attempt to monkey-patch `window.fetch`.
- **PWA Capabilities**: 
  - Service Worker (`/public/sw.js` v1.0.1) with app-shell precaching, offline navigation fallback, and message-based notification triggers.
  - Periodic Sync Purge: Completely removed the `periodicsync` event listener from `sw.js` and added proactive unregister cleanup for lingering tags in `main.tsx`. This eliminates the Chromium Background Sync Manager error ("Attempted to register a sync event without a window or registration tag too long") in iframe and non-standalone contexts.
  - Web App Manifest (`/public/manifest.json`) with standalone display, shortcuts, categories, and full suite of icons (48x48, 72x72, 96x96, 128x128, 192x192, 512x512, maskable icons, and apple-touch-icon).
  - In-app install banner & drawer button with Chromium install trigger and step-by-step iOS Safari installation modal.
  - Offline connectivity indicator banner (`useOnlineStatus`).
- **Design System & Customization**:
  - **Appearance Mode (Light / Dark / System)**:
    - Tailwind CSS v4 `@custom-variant dark` integrated with simultaneous `data-theme="dark"` attribute and `.dark` class synchronization on `document.documentElement` and `document.body`.
    - Native `color-scheme: dark` / `light` support ensures all browser inputs, scrollbars, and calendar/time pickers automatically render in dark mode.
    - Real-time `window.matchMedia('(prefers-color-scheme: dark)')` listener dynamically synchronizes with device system appearance.
    - Quick theme toggle in `TopBar` (Sun / Moon) and detailed mode selector in `SettingsScreen`.
    - Ambient radial gradient (`.ambient-gradient`) gracefully radiates a subtle aura of the selected sacred accent frequency across the viewport in dark mode.
    - Updates mobile browser `<meta name="theme-color">` dynamically (#111318 for dark, #fcf9f8 for light).
  - **Sacred Accent Colour Feature**:
    - 8 curated manifestation frequency presets with Chakra alignments: Cosmic Indigo (Third Eye), Mystic Violet (Crown), Abundance Emerald (Heart), Solar Amber (Solar Plexus), Sacred Rose (Divine Heart), Deep Ocean (Throat), Quantum Fire (Sacral), Obsidian Void (Root).
    - Custom color wheel picker (`<input type="color">`) allowing users to choose any sacred frequency.
    - Dynamic CSS variables (`--accent-color`, `--accent-rgb`, `--accent-container`, `--accent-hover`, `--accent-border`, `--accent-ring`, `--md-sys-color-primary`).
    - Pervasively colors all active bottom navigation pills, top bar badges, primary action buttons, streak indicators, borders, FABs, and live preview cards across the application.
    - Dynamic `.hero-text` class binds all primary headings, greeting titles, section headers, and hero labels directly to the chosen sacred accent color.
    - All action buttons (`.bg-accent`, `.hover-bg-accent`, `.btn-accent`) uniformly inherit the user's sacred accent frequency.
  - **Scripting Notebook Contrast in Dark Mode**:
    - High-contrast dark notebook paper aesthetic: deep `#101217` background with crisp white-tinted ruled lines (`rgba(255, 255, 255, 0.16)`) and an illuminated red margin guide (`rgba(239, 68, 68, 0.55)`).
    - In dark mode, textarea text is forced to pure white (`#ffffff` and `-webkit-text-fill-color: #ffffff`) with high-visibility placeholder (`rgba(255, 255, 255, 0.45)`) and matching sacred accent caret and text selection.
  - **Dark Mode Responsive Gradients**:
    - `.hero-gradient`, `.streak-gradient`, `.card-gradient`, and `.pwa-banner-gradient` dynamically transform in dark mode into obsidian/slate deep gradients (`#181b22` to `#121418`) accented with subtle sacred frequency glows.
- **Storage Strategy**:
  - **IndexedDB (`manifest-journal-db` v1)**:
    - Zero Sample Data: All mock profiles, pre-filled goals, sample journal entries, mock affirmations, and hardcoded streaks have been completely removed. The app starts as a pure clean canvas where the user creates their own authentic covenant, daily micro-intentions, and journal moments. A `purgeSampleData()` cleanup routine purges any lingering mock data from previous sessions.
    - `profile`: `{ id: "user-profile", name, dob, gender, selfie, pledgeText, quitClause, signature, committedAt }`
    - `goals`: `{ id, type: "today"|"month"|"year"|"5year"|"10year", text, setAt, deadline, completedAt, status: "active"|"completed"|"expired" }`
    - `script-pages`: `{ id, date, page, content, sessionComplete, createdAt }` (indexed by `date`)
    - `journal-entries`: `{ id, date, time, text, mediaRefs, createdAt }` (indexed by `date`)
    - `teleprompter-scripts`: `{ id, title, content, speed, createdAt }`
    - `album`: `{ id, filename, type: "photo"|"video"|"recording", source: "camera"|"journal"|"teleprompter", takenAt, width, height, durationMs }` (indexed by `takenAt`)
    - `settings`: `{ key: "theme", value }`, `{ key: "accentColor", value }`
    - `streaks`: `{ type: "scripting", count, lastDate }`
    - `fallback-blobs`: fallback binary storage if OPFS is not available in restricted webviews
  - **OPFS (Origin Private File System)**:
    - Root directory: `manifest-media/`
    - Subdirectories: `album/`, `journal-attachments/`, `teleprompter-recordings/`
    - Seamless fallback to IndexedDB Blob storage if OPFS is unavailable in restricted browser environments.
    - Export feature bundles IndexedDB JSON data and OPFS binary blobs into a downloadable `.zip` file via JSZip (`manifest-journal-export-YYYY-MM-DD.zip`).
  - **Storage Quota**:
    - Quota check on init using `navigator.storage.estimate()`, warning if remaining space is < 500MB.

---

## Screen Implementations & Workflows
1. **Commitment Screen (`/#commitment`)**:
   - 3-step onboarding covenant ceremony.
   - Step 1: Personal Identity (Name, DOB, Gender, Selfie photo capture/file).
   - Step 2: Pledge paragraph, speech synthesis reading aloud, signature canvas (`signature_pad`), "If I fail, I will quit ___" clause (mandatory).
   - Step 3: Success ceremony animation & redirection to Home. Read-only review accessible from Settings.
2. **Home Screen (`/#home`)**:
   - Time-based greeting ("Good Morning / Afternoon / Evening, [Name] ✨"), current date, alignment status, streak counter.
   - Today's Goal card with quick "Mark Done" toggle and completion evaluation.
   - Month Goal card with progress indicator.
   - Quick action shortcuts: Write Script, New Journal, Open Camera.
   - **Daily Affirmation Feature (`DailyAffirmationCard`)**:
     - Predefined local repository of 24+ positive, goal-orientated affirmations (`src/data/affirmations.ts`) spanning Goal Realization, Quantum Momentum, Relentless Focus, Courage & Action, Abundance & Wealth, and Inner Mastery.
     - Deterministic calendar date hashing ensures a fresh affirmation each day while remaining stable across page reloads on that date.
     - Interactive controls: Shuffle to draw another quote, SpeechSynthesis ("Listen Aloud"), One-tap Clipboard Copy.
     - Deep integration actions: "Script This" (prefills notebook lined paper in Scripting screen) and "Journal Reflection" (prefills reflection prompt in Journal modal).
3. **Goals Screen (`/#goals`)**:
   - 5 goal types: Today (end of day), Month (30d), Year (365d), 5-Year (1825d), 10-Year (3650d).
   - Real-time countdown timer ("X days Y hours Z mins").
   - Automated expiration evaluation dialog ("Did you achieve it?") extending deadlines or creating new ones.
4. **Scripting Screen (`/#scripting`)**:
   - Ruled notebook aesthetic with paper lines, present-moment affirmation header.
   - Multi-page support per day date with page counter ("Page X of Y").
   - Streak tracking (increments on consecutive days, resets if missed).
   - "Manifestation Goal Complete" button.
5. **Journal Screen (`/#journal`)**:
   - "Today" tab: anchored time entries with customizable timestamps.
   - Media attachments (camera photo capture, video recording, or album selection).
   - "History" tab: entries grouped chronologically by month and date.
   - Floating Action Button to anchor new moments.
6. **Album Screen (`/#album`)**:
   - 3-column media grid with photo, video, and teleprompter recording tags.
   - In-app Camera modal with photo capture (canvas frame) and video recording (MediaRecorder).
   - Full-screen media viewer dialog with download action (`<a download>`), Web Share, and deletion.
7. **Teleprompter Screen (`/#teleprompter`)**:
   - Script setup with scroll speed controller (0.5x - 3.0x) and preset affirmations.
   - Live camera preview with overlaid auto-scrolling script driven by `requestAnimationFrame`.
   - Current spoken word highlighting with glowing golden badge.
   - MediaRecorder recording saved directly to OPFS / Album.
8. **Knowledge Screen (`/#knowledge`)**:
   - Principles of manifestation, subconscious reprogramming, the 3-6-9 Nikola Tesla method, rules of alignment.
   - Curated video cards linking out to high-impact manifestation teachings.
9. **Settings Screen (`/#settings`)**:
   - Theme toggle (Light, Dark, System).
   - Accent color palette selector (Material You tonal variants).
   - View Signed Commitment Covenant.
   - Storage quota usage monitor.
   - Client-side full data export to ZIP (JSON + binary media).
   - Notification permissions & reminders.
   - Clear all data with safety confirmation.
   - Community links (GitHub & Buy Me a Coffee).
10. **Navigation**:
    - Fixed bottom tab bar (Scripting, Journal, Album, Teleprompter).
    - Top App Bar with hamburger drawer (Home, Goals, Knowledge, Commitment, Settings).
