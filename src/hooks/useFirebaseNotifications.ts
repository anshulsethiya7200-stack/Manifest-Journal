import { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { isSupported, getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { saveFCMToken, getFCMToken } from '../lib/storage';

// ════════════════════════════════════════════════════════════════════════════
// Firebase Credentials & VAPID Key
// Read securely from Vite environment variables (with fallback defaults)
// ════════════════════════════════════════════════════════════════════════════
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAFfTDrw0sESsTua52l_7JhA4Y-oW2Tlo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'manifest-journal-9bb90.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'manifest-journal-9bb90',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'manifest-journal-9bb90.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '338855149178',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:338855149178:web:23b6be17010acc887085c3',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EL3V0ENWEC',
};

export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BLKx1En_SrvgqjSjUsd0y3kFIxh3KNqDz9GTLHtmaEODTZX54dJj18ubBf5GBi_WpSplgbL8NysrU3QaWUUfXEo';

let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Safely initialize or retrieve the Firebase App instance.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseAppInstance) {
    firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return firebaseAppInstance;
}

/**
 * Core utility function to initialize Firebase notifications safely:
 * 1. Uses isSupported() to check environment compatibility before calling getMessaging().
 * 2. If isSupported() returns false, logs a clean warning and gracefully exits without crashing.
 * 3. If supported, requests notification permission and fetches the FCM registration token with the VAPID key.
 * 4. Saves the generated token into IndexedDB so it persists across sessions.
 */
export async function initializeFirebaseNotifications(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  supported: boolean;
  permission?: NotificationPermission;
}> {
  // Step 1: Pre-flight environment check
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('[Firebase Messaging] Environment does not support Web Push notifications.');
    return {
      success: false,
      supported: false,
      error: 'Web Push notifications are not supported by this browser.',
    };
  }

  // Step 2: Use an async function with isSupported() before calling getMessaging()
  let supported = false;
  try {
    supported = await isSupported();
  } catch (checkErr) {
    console.warn('[Firebase Messaging] Compatibility check error:', checkErr);
    return {
      success: false,
      supported: false,
      error: 'Error checking Firebase Messaging compatibility.',
    };
  }

  // Step 5: If isSupported() is false, prevent crashing, log clean warning, and gracefully exit
  if (!supported) {
    console.warn('[Firebase Messaging] isSupported() returned false. Gracefully exiting notification initialization.');
    return {
      success: false,
      supported: false,
      error: 'Firebase Cloud Messaging is not supported in this browser environment.',
    };
  }

  try {
    // Step 3: Proceed to request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      const msg = permission === 'denied'
        ? 'Notification permission was denied by the user.'
        : 'Notification permission prompt was dismissed.';
      console.warn(`[Firebase Messaging] ${msg}`);
      return {
        success: false,
        supported: true,
        permission,
        error: msg,
      };
    }

    // Register or get background service worker for Firebase Messaging
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('[Firebase Messaging] Service worker registration notice:', swErr);
      swRegistration = await navigator.serviceWorker.ready;
    }

    // Safe call to getMessaging() only after isSupported() resolved to true
    const app = getFirebaseApp();
    if (!messagingInstance) {
      messagingInstance = getMessaging(app);

      // Listen for incoming foreground messages
      onMessage(messagingInstance, (payload) => {
        console.log('[Firebase Messaging] Received foreground push message:', payload);
        const title = payload.notification?.title || payload.data?.title || 'Manifest Journal ✨';
        const body = payload.notification?.body || payload.data?.body || 'Stay anchored to your intention.';

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: payload.notification?.icon || '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
          });
        }
      });
    }

    // Fetch the registration token using the VAPID key
    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn('[Firebase Messaging] getToken() returned an empty token.');
      return {
        success: false,
        supported: true,
        permission,
        error: 'Unable to generate an FCM registration token from Firebase servers.',
      };
    }

    // Step 4: Save the successfully generated token into IndexedDB
    await saveFCMToken(token);
    console.log('[Firebase Messaging] FCM token successfully generated and persisted to IndexedDB:', token);

    return {
      success: true,
      token,
      supported: true,
      permission,
    };
  } catch (err: any) {
    console.warn('[Firebase Messaging] Initialization error:', err);
    return {
      success: false,
      supported: true,
      error: err?.message || 'An error occurred during push notification setup.',
    };
  }
}

/**
 * Reusable React custom hook for managing Firebase Cloud Messaging push notifications.
 *
 * Example usage:
 * ```tsx
 * const {
 *   isSupported,
 *   token,
 *   permission,
 *   loading,
 *   error,
 *   enableNotifications,
 *   testNotification,
 * } = useFirebaseNotifications();
 *
 * return (
 *   <button onClick={enableNotifications} disabled={loading}>
 *     Enable Notifications
 *   </button>
 * );
 * ```
 */
export function useFirebaseNotifications() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and load any persisted token on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSupportAndToken() {
      if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        if (isMounted) setSupported(false);
        return;
      }

      try {
        const isMsgSupported = await isSupported();
        if (isMounted) setSupported(isMsgSupported);

        if (isMsgSupported) {
          const existingToken = await getFCMToken();
          if (isMounted && existingToken) {
            setToken(existingToken);
          }
        }
      } catch (err) {
        console.warn('[useFirebaseNotifications] Initial support check failed:', err);
        if (isMounted) setSupported(false);
      }
    }

    checkSupportAndToken();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Action handler to trigger notification permission prompt and fetch FCM token.
   */
  const enableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await initializeFirebaseNotifications();

    if (result.permission) {
      setPermission(result.permission);
    }

    if (result.success && result.token) {
      setToken(result.token);
      setError(null);
    } else {
      setError(result.error || 'Failed to enable notifications.');
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Action handler to trigger a local test notification.
   */
  const testNotification = useCallback(
    async (
      title = 'Manifest Journal ✨',
      body = 'Push notifications are active and connected!'
    ) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return false;
      if (Notification.permission !== 'granted') return false;

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'manifest-ritual-alert',
          });
          return true;
        }

        new Notification(title, {
          body,
          icon: '/icons/icon-192.png',
        });
        return true;
      } catch (err) {
        console.warn('[useFirebaseNotifications] Test notification failed:', err);
        return false;
      }
    },
    []
  );

  return {
    isSupported: supported,
    token,
    permission,
    loading,
    error,
    enableNotifications,
    testNotification,
  };
}
