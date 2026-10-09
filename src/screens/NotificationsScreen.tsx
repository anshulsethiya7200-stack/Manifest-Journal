import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Copy,
  Check,
  Send,
  AlertCircle,
  Shield,
  Sparkles,
  Clock,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';
import { getSetting, setSetting } from '../lib/storage';

interface NotificationsScreenProps {
  onNavigateHome?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = () => {
  const {
    isSupported,
    token: fcmToken,
    loading: isLoading,
    error: fcmError,
    enableNotifications,
    testNotification,
  } = useFirebaseNotifications();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [morningReminder, setMorningReminder] = useState<boolean>(true);
  const [eveningReminder, setEveningReminder] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const morning = await getSetting<boolean>('reminder_morning', true);
      const evening = await getSetting<boolean>('reminder_evening', true);
      setMorningReminder(morning);
      setEveningReminder(evening);
    })();
  }, []);

  const handleEnableNotifications = async () => {
    setStatusMessage('Requesting notification permission & generating device token...');
    setErrorMessage(null);

    const result = await enableNotifications();
    if (result.success && result.token) {
      setStatusMessage('Push notifications enabled & device registered in IndexedDB!');
    } else {
      setErrorMessage(result.error || 'Failed to register device for push notifications.');
    }
  };

  const handleTestNotification = async () => {
    const success = await testNotification(
      'Manifest Journal ✨',
      'Ritual Alert: Take 3 deep breaths and reconnect with your daily intentions.'
    );
    if (success) {
      setStatusMessage('Test notification sent to your device!');
    } else {
      setErrorMessage('Could not display test notification. Check browser permissions.');
    }
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleToggleMorning = async () => {
    const nextVal = !morningReminder;
    setMorningReminder(nextVal);
    await setSetting('reminder_morning', nextVal);
  };

  const handleToggleEvening = async () => {
    const nextVal = !eveningReminder;
    setEveningReminder(nextVal);
    await setSetting('reminder_evening', nextVal);
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold hero-text flex items-center gap-2">
          <Bell className="w-6 h-6 text-accent" />
          <span>Ritual Alerts & Push Notifications</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Stay anchored to your morning & evening practices with background Firebase Cloud Messaging (FCM).
        </p>
      </div>

      {/* Main Activation Card */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-container text-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
                Firebase Push Notification Service
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {fcmToken
                  ? 'Device registered with Firebase Cloud Messaging'
                  : 'Receive timely morning and evening prompts even when the app is closed'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
              fcmToken
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            {fcmToken ? 'Active ✓' : 'Setup Required'}
          </span>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isSupported && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Push notifications are not supported in this browser environment.</span>
          </div>
        )}

        {/* Primary Action Button: "Enable Notifications" */}
        <div className="pt-2">
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || !isSupported}
            className="w-full py-3.5 px-6 rounded-full bg-accent text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition hover:opacity-95 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registering Device with Firebase...</span>
              </>
            ) : fcmToken ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Re-Register / Refresh Device Token</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        </div>

        {/* Test Notification Button */}
        {fcmToken && (
          <button
            onClick={handleTestNotification}
            className="w-full py-2.5 px-4 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-accent" />
            <span>Send Test Notification Now</span>
          </button>
        )}
      </div>

      {/* FCM Registration Token Display Card */}
      {fcmToken && (
        <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>FCM Registration Token</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Saved in IndexedDB
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            This unique token identifies your browser device for secure push alerts from Firebase Cloud Messaging.
          </p>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
            <code className="text-[10px] font-mono text-slate-700 dark:text-slate-300 break-all select-all line-clamp-2">
              {fcmToken}
            </code>
            <button
              onClick={handleCopyToken}
              className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white shrink-0 hover:bg-slate-100 dark:hover:bg-zinc-700 transition active:scale-95"
              title="Copy token to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Rituals Preferences */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
          <Clock className="w-4 h-4 text-accent" />
          <span>Daily Ritual Schedules</span>
        </div>

        <div className="space-y-3">
          {/* Morning Ritual */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950">
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Morning Intention Anchor (7:00 AM)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Set daily goals and script your 3-6-9 intentions for the day ahead.
              </p>
            </div>
            <button
              onClick={handleToggleMorning}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                morningReminder ? 'bg-accent' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
              aria-label="Toggle morning reminder"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  morningReminder ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Evening Ritual */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950">
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Evening Reflection Ritual (8:00 PM)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record gratitude reflections, log your victories, and anchor peace.
              </p>
            </div>
            <button
              onClick={handleToggleEvening}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                eveningReminder ? 'bg-accent' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
              aria-label="Toggle evening reminder"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  eveningReminder ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security & Privacy Assurance */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-950 border border-black/5 dark:border-white/10 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            Zero Manuscript or Journal Transmission
          </p>
          <p className="text-[11px] leading-relaxed">
            The Firebase Cloud Messaging service strictly routes notification delivery signals to your device background service worker (<code>firebase-messaging-sw.js</code>). Your written journal reflections, personal goals, and private media files remain 100% inside your local device's IndexedDB and OPFS storage.
          </p>
        </div>
      </div>
    </div>
  );
};
