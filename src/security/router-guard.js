// ═══════════════════════════════════════
// FILE: src/security/router-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

export const ALLOWED_ROUTES = [
  'home',
  'journal',
  'scripting',
  'goals',
  'album',
  'teleprompter',
  'knowledge',
  'commitment',
  'settings',
  'notifications',
];

/**
 * Sanitizes a URL hash into a verified, authorized application route.
 *
 * @param {string} hash
 * @returns {string}
 */
export function sanitizeRoute(hash) {
  if (typeof hash !== 'string') return 'home';

  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();

  if (ALLOWED_ROUTES.includes(clean)) {
    return clean;
  }

  if (clean) {
    console.warn(`[Router Guard] Blocked unrecognized route "${clean}". Defaulting to home.`);
  }

  return 'home';
}

/**
 * Initializes secure hash routing listener and triggers initial render callback.
 *
 * @param {(route: string) => void} renderFn
 */
export function initRouter(renderFn) {
  if (typeof window === 'undefined' || typeof renderFn !== 'function') return;

  const handleRoute = () => {
    const safeRoute = sanitizeRoute(window.location.hash);
    renderFn(safeRoute);
  };

  window.addEventListener('hashchange', handleRoute);

  // Trigger initial route
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleRoute);
  } else {
    handleRoute();
  }

  return () => {
    window.removeEventListener('hashchange', handleRoute);
  };
}
