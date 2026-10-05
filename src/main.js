// ═══════════════════════════════════════
// FILE: src/main.js
// Manifest Journal — Security Integration
// ═══════════════════════════════════════

import { initRuntimeProtections } from './security/runtime-guard.js';
import { runIntegrityCheck } from './security/db-guard.js';
import { initRouter } from './security/router-guard.js';

// 1. Initialize runtime protections immediately (freeze globals, devtools, clickjacking)
initRuntimeProtections();

// 2. Initialize Service Worker with security checks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW Security] Active with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW Security] Registration failed:', err);
      });
  });
}

// 3. Initialize secure router
initRouter((safeRoute) => {
  console.info(`[Router] Navigating to verified route: #${safeRoute}`);
  // Mount/render the corresponding screen component based on safeRoute
});
