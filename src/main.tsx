import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initRuntimeProtections } from './security/runtime-guard.js';

// Initialize security protections before rendering
initRuntimeProtections();

// Register Service Worker for offline capability & notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        console.log('[SW] Registered successfully with scope:', reg.scope);
        // Force update to pick up v1.0.1 without periodicsync
        try {
          await reg.update();
        } catch {
          // Ignore
        }

        // Clean up any stale periodicSync tags from previous runs
        if ('periodicSync' in reg) {
          try {
            // @ts-ignore
            const tags = await reg.periodicSync.getTags();
            for (const tag of tags) {
              // @ts-ignore
              await reg.periodicSync.unregister(tag);
            }
          } catch {
            // Periodic sync unregister suppressed in sandbox
          }
        }
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

