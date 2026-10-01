<div align="center">

<img src="./icons/icon-512.png" alt="Manifest Journal Logo" width="120" height="120" />

# Manifest Journal

**Write it. Feel it. Make it real.**

A private, offline-first journaling and manifestation PWA — built for people who take their intentions seriously.

[![PWA](https://img.shields.io/badge/PWA-ready-0b57d0?logo=googlechrome&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Local First](https://img.shields.io/badge/Storage-IndexedDB%20%2B%20OPFS-444746)](https://web.dev/storage-for-the-web/)
[![No Server](https://img.shields.io/badge/Backend-None-success)](https://localfirstweb.dev/)

[Install the App](#installation) · [Features](#features) · [Screenshots](#screenshots) · [How It Works](#how-it-works) · [Export Your Data](#exporting-your-data) · [Contributing](#contributing) · [Support](#support)

</div>

---

## What Is Manifest Journal?

Manifest Journal is a **completely private, local-first** Progressive Web App for intentional living. It combines structured journaling, the 3-6-9 manifestation method, goal tracking, a personal media album, and an affirmation teleprompter — all in one place, all on your device.

**Your data never leaves your phone.** There is no account, no cloud, no subscription, and no server. Everything you write, photograph, and record is stored locally using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and the [Origin Private File System (OPFS)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). You own it completely.

---

## Features

### 🤝 Commitment Ceremony
Start your journey with a one-time pledge. Enter your name, date of birth, gender, and a selfie. Listen to your pledge read aloud, sign it with your finger, and write your personal "If I fail, I will quit ______" clause. A ceremony that makes it real.

### 📚 Knowledge: Learn to Manifest
A comprehensive, always-available guide covering what manifestation is, why it works, the **3-6-9 method** step by step, and curated YouTube links — no internet needed to read it.

### 🎯 Goals — 5 Layers of Vision
Set goals across five time horizons:

| Type | Horizon |
|---|---|
| Today | End of day |
| This Month | 30 days |
| This Year | 365 days |
| 5 Years | 1,825 days |
| 10 Years | 3,650 days |

When a goal's deadline passes, the app asks: *"Did you achieve this?"* — Yes opens a new goal. No keeps the same goal and resets the clock. You can also mark goals complete early.

### ✍️ Scripting
A distraction-free notebook where you write what you want to manifest — every day. Multi-page sessions, a live **streak counter**, and a Manifestation Goal Complete button to close each session with intention.

### 📖 Journal
Time-anchored entries for your day. Each entry is pinned to a specific time — capturing not just *what* happened but *when*. Attach photos and videos directly in your journal. Browse your full history, grouped by month.

### 🖼️ Album
A private gallery for every photo and video taken inside the app. Each item carries the exact date and time it was captured. Download any image to your phone's gallery whenever you choose. Camera button built in — what you shoot stays in the app, not your camera roll.

### 📽️ Teleprompter
Write an affirmation script. Set the scroll speed. Hit record — the camera opens with your text scrolling over it, word by word, so you can record yourself speaking your intentions directly to camera. All recordings save to your Album.

### ⚙️ Settings
- Light / Dark / System theme
- Custom accent color
- Export everything as a `.zip` file (journal, scripts, goals, album, commitment)
- Clear all data
- App version and links

### 🔔 Notifications
Daily reminders (via Service Worker) nudge you to journal, check your goals, and keep your scripting streak alive — even when the app isn't open.

---

## Screenshots

> *(Add screenshots here once the app is built — Home, Journal, Scripting, Album, Teleprompter)*

---

## Installation

Manifest Journal is a PWA — no app store needed.

### On Android (Chrome)
1. Open the app URL in Chrome.
2. Tap the **"Install"** banner that appears, or tap the three-dot menu → **"Add to Home Screen"**.
3. The app icon appears on your home screen. Open it like any app — it works fully offline.

### On Desktop (Chrome / Edge)
1. Open the app URL.
2. Click the **install icon** (⊕) in the address bar.
3. Click **"Install"**.

### On iOS (Safari)
1. Open the app URL in Safari.
2. Tap the **Share** button → **"Add to Home Screen"**.
3. Tap **"Add"**.

> **Note:** Full camera and media recording features require HTTPS and a modern browser. Chrome/Edge on Android gives the best experience. Safari iOS 17+ is supported with minor limitations on video recording codecs.

---

## How It Works

### Storage Architecture

All user data lives in two browser storage layers:

IndexedDB ("manifest-journal-db")
├── profile — name, DOB, pledge, signature
├── goals — all 5 goal types with deadlines and history
├── script-pages — scripting entries (multi-page, per day)
├── journal-entries — time-anchored entries with media references
├── album — metadata for all photos/videos
├── teleprompter-scripts
├── streaks — scripting streak data
└── settings — theme, accent color

OPFS ("manifest-media/")
├── album/ — photos and videos from camera
├── journal-attachments/ — media attached to journal entries
└── teleprompter-recordings/ — recorded affirmation videos


Media files (photos, videos, recordings) are stored as raw binaries in OPFS — fast, efficient, and private. Text and metadata live in IndexedDB. Nothing is base64-bloated in the database for large files.

### Offline First

The Service Worker pre-caches the entire app shell on install. After the first load, Manifest Journal works with zero internet connection — all features, all screens, all data.

### Notifications

Notification permission is requested after you complete the Commitment ceremony. The Service Worker handles daily reminders:
- **7 AM** — Goal check-in
- **9 AM** — Scripting streak reminder
- **8 PM** — Evening journal prompt

Tapping a notification deep-links directly to the relevant screen.

---

## Exporting Your Data

Go to **Settings → Export Data**. The app bundles everything into a single zip file and downloads it to your device:

manifest-journal-export-YYYY-MM-DD.zip
├── data/
│ ├── profile.json
│ ├── goals.json
│ ├── scripts.json
│ ├── journal.json
│ └── settings.json
└── media/
├── album/
├── journal-attachments/
└── teleprompter-recordings/


The export is entirely client-side. No data touches a server at any point.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App shell | Vanilla JS (ES Modules) |
| UI System | Google Material Design 3 |
| Typography | Roboto (Google Fonts) |
| Icons | Material Symbols |
| Structured storage | IndexedDB via `idb` |
| Binary media storage | Origin Private File System (OPFS) |
| Offline | Service Worker (cache-first) |
| Signature capture | `signature_pad` |
| Data export | `JSZip` |
| Camera & recording | `getUserMedia` + `MediaRecorder` API |
| Teleprompter scroll | `requestAnimationFrame` |
| Pledge audio | Web Speech Synthesis API |
| Notifications | Notification API + Service Worker |
| Routing | Hash-based SPA (vanilla JS) |

**No framework. No build step required. No backend. No dependencies that phone home.**

---

## Browser Support

| Browser | Support | Notes |
|---|---|---|
| Chrome / Edge (Android) | ✅ Full | Recommended |
| Chrome / Edge (Desktop) | ✅ Full | |
| Samsung Internet 22+ | ✅ Full | Chromium-based |
| Firefox 119+ | ✅ Mostly | OPFS support may vary; media falls back to IDB |
| Safari iOS 17+ | ⚠️ Partial | Camera/recording works; video codec limitations |

---

## Privacy

> **Manifest Journal stores everything on your device. Nothing is ever sent to a server.**

- No user accounts
- No analytics or tracking
- No third-party scripts except Google Fonts (typography only)
- No ads, no telemetry, no metrics
- OPFS is sandboxed by browser origin — inaccessible to other apps or websites
- All camera and microphone access stays on-device

When you clear your data or uninstall the app, everything is gone. There is no recovery from a server because there is no server.

---

## Roadmap

### V1.0 — MVP
- [x] All 10 screens designed and specified
- [ ] Commitment ceremony (profile, pledge, signature)
- [ ] Goals with deadline logic and completion dialogs
- [ ] Scripting with streak counter
- [ ] Journal with time entries and media attachments
- [ ] Album with camera capture (OPFS)
- [ ] Teleprompter with camera overlay and recording
- [ ] Knowledge screen (3-6-9 method, curated links)
- [ ] Settings (theme, export, clear)
- [ ] Service Worker + manifest.json + notifications

### V2.0 — Future
- [ ] Cloud backup (optional, user-controlled)
- [ ] AI journaling prompts (on-device, no cloud)
- [ ] Multipage teleprompter scripts
- [ ] Mood tracking within journal entries
- [ ] Weekly and monthly review screens
- [ ] Widget for home screen streak display

---

## Contributing

Manifest Journal is open source. Contributions are welcome.

```bash
# Clone the repo
git clone https://github.com/[your-username]/manifest-journal.git
cd manifest-journal

# No build step needed — open index.html directly
# Or serve locally (required for Service Worker + OPFS):
npx serve .
# Then open http://localhost:3000
```

**Before contributing:**
- Read the PRD (`docs/PRD.md`) to understand the intended behavior.
- Keep it local-first. No feature should require a network connection or a server.
- Follow the Material Design 3 token system — no hardcoded colors.
- Test on at least Chrome Android and Safari iOS before submitting a PR.

---

## Support

If Manifest Journal has brought value to your life or practice, consider buying me a coffee. It helps keep this project maintained and ad-free.

<a href="https://www.buymeacoffee.com/anshuljain" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" height="48">
</a>

---

<div align="center">

Made with intention. Built for privacy. Kept on your device.

**Manifest Journal** · [Report an Issue](https://github.com/[your-username]/manifest-journal/issues) · [GitHub](https://github.com/[your-username]/manifest-journal)

</div>
