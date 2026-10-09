import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { saveFCMToken, getFCMToken } from './storage';

// ════════════════════════════════════════════════════════════════════════════
// Manifest Journal — Firebase Push Notification Service
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

let appInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Initializes and returns the Firebase app instance safely.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return appInstance;
}

/**
 * Checks if Firebase messaging and browser notifications are supported in this environment.
 */
export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  try {
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.warn('Firebase isSupported() check failed:', err);
    return false;
  }
}

/**
 * Gets or initializes the Firebase messaging instance.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const supported = await isMessagingSupported();
  if (!supported) return null;

  if (!messagingInstance) {
    try {
      const app = getFirebaseApp();
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
    } catch (err) {
      console.warn('Error initializing Firebase messaging:', err);
      return null;
    }
  }

  return messagingInstance;
}

export interface NotificationEnableResult {
  success: boolean;
  token?: string;
  error?: string;
  permission?: NotificationPermission;
}

/**
 * Core Workflow:
 * 1. Checks support and registers background service worker.
 * 2. Requests user permission via Notification.requestPermission().
 * 3. If granted, retrieves FCM registration token using VAPID key.
 * 4. Persists the token into IndexedDB.
 */
export async function enableFirebaseNotifications(): Promise<NotificationEnableResult> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window context unavailable.' };
  }

  if (!('Notification' in window)) {
    return { success: false, error: 'Push notifications are not supported in this browser.' };
  }

  try {
    // 1. Request notification permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied' ? 'Notification permission was denied.' : 'Notification permission dismissed.',
      };
    }

    // 2. Ensure Service Worker is registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('Direct SW registration failed, falling back to ready registration:', swErr);
        swRegistration = await navigator.serviceWorker.ready;
      }
    }

    // 3. Initialize Messaging
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return {
        success: false,
        permission,
        error: 'Firebase Cloud Messaging is not supported or failed to initialize in this environment.',
      };
    }

    // 4. Retrieve FCM Registration Token using VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return {
        success: false,
        permission,
        error: 'No FCM registration token received from Firebase servers.',
      };
    }

    // 5. Save registration token to IndexedDB
    await saveFCMToken(token);
    console.log('[Firebase Messaging] Successfully obtained and saved FCM token:', token);

    return {
      success: true,
      token,
      permission,
    };
  } catch (err: any) {
    console.error('Failed to enable Firebase push notifications:', err);
    return {
      success: false,
      error: err?.message || 'Failed to complete push notification setup.',
    };
  }
}

/**
 * Sends a local test notification to verify display capabilities.
 */
export async function triggerTestNotification(title = 'Manifest Journal ✨', body = 'Push notifications are fully enabled and active!'): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: 'manifest-test-alert',
      });
      return true;
    }

    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
    });
    return true;
  } catch (err) {
    console.warn('Trigger test notification failed:', err);
    return false;
  }
}

/**
 * Gets currently saved FCM registration token from IndexedDB.
 */
export async function getExistingFCMToken(): Promise<string | null> {
  return await getFCMToken();
}
