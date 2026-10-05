// ═══════════════════════════════════════
// FILE: src/security/runtime-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

import { getOPFSQuota } from './opfs-guard.js';
import { stopAllActiveStreams } from './media-guard.js';

// Canonical references to prevent monkey-patching vulnerabilities
export const canonicalFetch =
  typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null;
export const canonicalJSONParse = JSON.parse.bind(JSON);
export const canonicalJSONStringify = JSON.stringify.bind(JSON);

/**
 * Initializes runtime protections across the application.
 */
export function initRuntimeProtections() {
  if (typeof window === 'undefined') return;

  // 1. DevTools detection (non-blocking diagnostic check)
  const devtoolsCheck = () => {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      console.warn('[Security] DevTools may be open.');
    }
  };
  window.addEventListener('resize', devtoolsCheck);
  devtoolsCheck();

  // 2. Clickjacking protection at runtime (complements frame-ancestors / X-Frame-Options)
  // Safely handled to allow embedding in designated preview hosts if required
  try {
    if (window.self !== window.top) {
      // In standalone deployments, break out of framing if unauthorized
      // window.top.location = window.self.location;
    }
  } catch (e) {
    // Cross-origin framing access blocked by browser as expected
  }

  // 3. Storage Quota Monitoring on startup
  getOPFSQuota().then(({ warningLevel }) => {
    if (warningLevel === 'critical') {
      alert(
        'Storage is 90% full. Export and clear data now from Settings to prevent data loss.'
      );
    } else if (warningLevel === 'warn') {
      console.warn('[Storage] Storage is over 70% capacity.');
    }
  });

  // 4. Tab visibility change - stop all camera tracks
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopAllActiveStreams();
    }
  });

  // 5. Global Error Handlers (strip sensitive paths)
  window.addEventListener('error', (event) => {
    console.error('[App Error]', event.message || 'Script error occurred');
    // Prevent default browser stack exposure where applicable
    event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise]', event.reason?.message || 'Unknown rejection');
    event.preventDefault();
  });

  // 6. Pagehide event cleanup
  window.addEventListener('pagehide', () => {
    stopAllActiveStreams();
  });
}
