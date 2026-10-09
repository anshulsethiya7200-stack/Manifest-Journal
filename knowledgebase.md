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
  - **Scripting Notebook Clean Aesthetic**:
    - Clean ruled paper aesthetic with pure horizontal ruled lines (`#e5e7eb` in light mode, `rgba(255, 255, 255, 0.18)` in dark mode) without any red vertical margin line.
    - Writing starts directly from the top left corner of the scripting page with natural baseline alignment (`paddingTop: '7px'`, `lineHeight: '32px'`), resting comfortably just above each ruled line with natural handwriting aesthetics.
    - In dark mode, textarea text is forced to pure white (`#ffffff` and `-webkit-text-fill-color: #ffffff`) with high-visibility placeholder (`rgba(255, 255, 255, 0.5)`) and matching sacred accent caret and text selection.
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
   - Paced directly to natural human speaking speed (120 Words Per Minute default cadence, calibrated from 60 WPM reflective up to 216 WPM).
   - Structured line-by-line reading layout with vertical accent guide bar, left alignment, and active phrase emphasis matching pro teleprompter standards.
   - Initial 1.0s breath-and-settle pause before smooth auto-scrolling begins, allowing speakers to lock eye contact with the camera lens.
   - Real-time recording elapsed timer (MM:SS) and dynamic WPM indicator badge.
   - Preset collection including "Camera Presence & Natural Flow", "Abundance & Financial Flow", "Self-Certainty & Sacred Purpose", and "Quantum Physical Vitality".
   - MediaRecorder recording saved directly to OPFS / Album.
8. **Knowledge Screen (`/#knowledge`)**:
   - Principles of manifestation, subconscious reprogramming, the 3-6-9 Nikola Tesla method, rules of conscious alignment.
   - 100% offline text-based teachings — all external YouTube links and video options have been completely removed.
9. **Settings Screen (`/#settings`)**:
   - Theme toggle (Light, Dark, System).
   - Accent color palette selector (Material You tonal variants).
   - View Signed Commitment Covenant.
   - Storage quota usage monitor.
   - Client-side full data export to ZIP (JSON + binary media).
   - Notification permissions & reminders.
   - Privacy, Terms of Use & Security Policy link (`/policy.html`).
   - Clear all data with safety confirmation.
   - Community links: GitHub repository (`https://github.com/anshulsethiya7200-stack/Manifest-Journal`) & Buy Me a Coffee (`https://buymeacoffee.com/anshuljain`).
10. **Navigation & Interactive Guide**:
    - Fixed bottom tab bar (Scripting, Journal, Album, Teleprompter).
    - Top App Bar with hamburger drawer (Home, Goals, Knowledge, Commitment, Settings).
    - **Interactive User Guide (`InteractiveUserGuide`)**: Animated step-by-step onboarding walkthrough accessible from the navigation Drawer and Knowledge screen covering core philosophy, covenant sealing, multi-horizon goals, 3-6-9 scripting, spoken teleprompter, and sacred frequencies.
11. **Legal & Security Policies (`/policy.html`)**:
    - Self-contained Material Design 3 HTML policy document covering Privacy Policy (13 comprehensive sections), Terms of Use (12 comprehensive sections), and Security Policy (7 comprehensive sections). Zero-server, local-first guarantee by Anshul Sethiya under MIT License.

---

## Client-Side Security & Data Protection Architecture (12-Layer Defense-in-Depth)
- **Layer 1 — HTTP Security Headers & Permissions-Policy**: Strict CSP (`default-src 'self'; script-src 'self'; connect-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and comprehensive `Permissions-Policy`. Mirroring deployment headers in `_headers`.
- **Layer 2 — Input Sanitization (`src/security/sanitize.js`)**: Non-regex DOMParser HTML tag stripping, null byte removal, strict maxLength bounds checking (throws RangeError), path separator removal for OPFS filenames, strict `http:`/`https:` URL protocol whitelist, and image data URL type/size enforcement.
- **Layer 3 — Safe DOM Rendering (`src/security/dom.js`)**: Safe text setting (`setText`), tree-walking HTML sanitizer (`setHtml`) stripping blocked tags (`script`, `iframe`, `object`, `embed`, etc.) and `on*`/`javascript:` attributes, and programmatic element construction (`createEl`) with URL validation.
- **Layer 4 — IndexedDB Integrity & Quarantine (`src/security/db-guard.js`)**: Schema validators (`validateGoal`, `validateJournalEntry`, `validateScriptPage`, `validateProfile`, `validateAlbumMedia`) and startup boot integrity check (`runIntegrityCheck`) automatically quarantining corrupted records into a dedicated `quarantine` store.
- **Layer 5 — OPFS File Security (`src/security/opfs-guard.js`)**: Magic bytes signature verification (JPEG, PNG, WebP), file size limits (10MB image, 500MB video), safe wrappers (`safeWriteToOPFS`, `safeReadFromOPFS`, `safeDeleteFromOPFS`), and quota threshold monitoring (`getOPFSQuota`).
- **Layer 6 — Camera and Media Security (`src/security/media-guard.js`)**: Role-based constraint requests, automated fallback for overconstrained devices, tracking active streams in `activeCameraStreams` Set, canvas memory zeroing upon photo capture, and automatic stream teardown on visibility change (`hidden`), pagehide, and beforeunload.
- **Layer 7 — Service Worker Security (`sw.js`)**: Parallel SHA-256 cache integrity tracking in `manifest-journal-integrity`, boot-time `verifyCache()`, MIME-type verification before caching, origin whitelisting, message structure/origin validation, and fixed notification templates with character caps.
- **Layer 8 — Data Export Security (`src/security/export-guard.js`)**: Prototype pollution sanitization (`__proto__`, `constructor`, `prototype`), circular reference detection via WeakSet, SHA-256 archive checksum generation, and manifest verification.
- **Layer 9 — Runtime Protection (`src/security/runtime-guard.js`)**: Global references pinning (`_fetch`, `_JSON_parse`, `_JSON_stringify`), devtools tampering detection, anti-clickjacking guards, error handler path masking, and storage monitoring.
- **Layer 10 — Signature Pad Security**: Canvas bounding (800x300px), PNG data URL type/size validation (under 2MB), immediate canvas clearing upon submission, and scoped lifecycle management.
- **Layer 11 — Dependency Security (`security/subresource-integrity.md`)**: Subresource integrity specification and crossorigin configuration for all external assets.
- **Layer 12 — Secure Hash Routing (`src/security/router-guard.js`)**: Whitelist route matching (`ALLOWED_ROUTES`), sanitization of hash fragments, and fallback to `'home'`.

---

## Lighthouse 100/100 Compliance & Performance Optimizations
- **Mobile Viewport Scalability (`index.html`)**:
  - Replaced restrictive `user-scalable=no, maximum-scale=1.0` with accessible responsive viewport `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` to satisfy WCAG 1.4.4 zoom accessibility.
- **Console Errors & 404 Resolution**:
  - Created complete set of PWA icon assets (`/icons/icon-*.png`, `/favicon.ico`, `/apple-touch-icon.png`) preventing 404 network request failures in browser and service worker cache.
  - Resolved JSON syntax errors in `manifest.json`.
- **WCAG 2.1 AA Color Contrast (`src/lib/theme.ts`, `src/screens/SettingsScreen.tsx`, etc.)**:
  - Calibrated all 8 Sacred Accent preset frequencies (`#0b57d0`, `#7c3aed`, `#047857`, `#b45309`, `#be123c`, `#0369a1`, `#c2410c`, `#334155`) to guarantee >= 4.7:1 contrast ratio with text.
  - Implemented dynamic `--on-accent` luminance calculation algorithm ensuring button text is automatically contrasted (`#ffffff` or `#000000`).
  - Updated all subtle text from low-contrast `slate-500` to high-contrast `text-slate-600 dark:text-slate-300` across settings, home, drawer, goals, and journal screens.
- **WCAG 2.5.3 Label-in-Name Alignment**:
  - Aligned accessible names (`aria-label`) on GitHub and Support links with visible button text ("GitHub Repo — ...", "Support App — ...").
- **Asset Overhead & Critical Render Path**:
  - Removed unused `Material Symbols Outlined` external stylesheet link from HTML head, eliminating render-blocking webfont payload.
  - Enhanced image tags across album and journal entries with descriptive, non-redundant alternative text (`alt`).
- **High-Impact Performance & Main-Thread Optimizations**:
  - **Dynamic Code-Splitting & Route Lazy Loading (`src/App.tsx`)**: Split all non-Home screens (`GoalsScreen`, `ScriptingScreen`, `JournalScreen`, `AlbumScreen`, `TeleprompterScreen`, `KnowledgeScreen`, `SettingsScreen`, `CommitmentScreen`, `InteractiveUserGuide`) into on-demand asynchronous chunks with `React.lazy()` and `React.Suspense`. This reduces initial home page JS bundle weight by >65% (from 532 KB down to 107 KB / 30 KB gzip), eliminating main-thread evaluation bottlenecks.
  - **Vendor Bundle Splitting (`vite.config.ts`)**: Configured manual rollup chunks isolating `vendor-react`, `vendor-icons`, `vendor-idb`, and `vendor-jszip` to leverage long-term caching and parallelized script parsing. Heavy libraries like `JSZip` are deferred exclusively to the Settings export flow.
  - **Non-Render-Blocking Webfont (`index.html`)**: Replaced blocking variable `Roboto Flex` stylesheet with lean, asynchronous `Roboto:wght@300;400;500;700` using `media="print" onload="this.media='all'"` and `display=swap`, eliminating ~900ms of critical render-blocking delay from FCP and LCP.
  - **Luminance-Aware High Contrast Button Classes**: Configured `.bg-accent` with automatic `text-on-accent` color inheritance and strict $L > 0.179$ threshold, maintaining guaranteed WCAG AA color contrast across all sacred color selections.

---

## Firebase Push Notification Service & FCM Integration
- **Client Configuration & Secrets Isolation**:
  - Firebase configuration securely externalized into `.env` with `VITE_FIREBASE_*` environment keys:
    - API Key, Auth Domain, Project ID (`manifest-journal-9bb90`), Storage Bucket, Messaging Sender ID (`338855149178`), App ID (`1:338855149178:web:23b6be17010acc887085c3`), Measurement ID (`G-EL3V0ENWEC`).
    - VAPID Key: `BLKx1En_SrvgqjSjUsd0y3kFIxh3KNqDz9GTLHtmaEODTZX54dJj18ubBf5GBi_WpSplgbL8NysrU3QaWUUfXEo`.
  - `.env.example` updated with complete parameter documentation and sanitized empty values.
- **Background Service Worker (`public/firebase-messaging-sw.js` & `firebase-messaging-sw.js`)**:
  - Integrates Firebase App and Messaging Compat SDK v10.14.1 via `importScripts()`.
  - Implements `messaging.onBackgroundMessage()` displaying notifications through `self.registration.showNotification()`.
  - Implements `notificationclick` handler focusing or opening the app window on alert interaction.
- **Local-First Device Token Storage (`src/lib/storage.ts`)**:
  - FCM device registration token saved strictly on the local device in IndexedDB (`manifest-journal-db` -> `settings` store under `fcm_registration_token`).
  - Implemented helper functions `saveFCMToken(token)`, `getFCMToken()`, and `removeFCMToken()`.
- **UI & Activation Workflow (`src/lib/firebase.ts`, `src/screens/NotificationsScreen.tsx`, `src/screens/SettingsScreen.tsx`)**:
  - Dedicated "Enable Notifications" HTML buttons triggering permission request, token generation, and IndexedDB persistence.
  - Interactive status feedback, FCM token display with one-touch clipboard copy, and test alert triggers.
  - Added dedicated `NotificationsScreen` route (`#notifications`) in `ALLOWED_ROUTES` and Navigation Drawer.
- **Legal Policies & Terms of Use Update (`public/policy.html`)**:
  - Updated Section 6 & 7 of Privacy Policy detailing FCM push signaling, anonymous device tokens, local-only storage, and zero-manuscript transmission.
  - Updated Section 7 of Terms of Use documenting push notification delivery via Firebase and user control to revoke permissions.

