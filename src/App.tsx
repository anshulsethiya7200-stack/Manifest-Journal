import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Goal, AppSettings, StorageEstimateInfo } from './types';
import {
  getProfile,
  getAllGoals,
  getStreak,
  getAppSettings,
  setSetting,
  initializeDefaultGoalsIfEmpty,
  checkStorageQuota,
  getAllJournalEntries,
  purgeSampleData,
} from './lib/storage';
import { applyTheme, applyAccentColor } from './lib/theme';
import { TopBar, BottomNav } from './components/Navigation';
import { Drawer } from './components/Drawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { sanitizeRoute } from './security/router-guard.js';
import { runIntegrityCheck } from './security/db-guard.js';

import { HomeScreen } from './screens/HomeScreen';

const GoalsScreen = React.lazy(() =>
  import('./screens/GoalsScreen').then((m) => ({ default: m.GoalsScreen }))
);
const ScriptingScreen = React.lazy(() =>
  import('./screens/ScriptingScreen').then((m) => ({ default: m.ScriptingScreen }))
);
const JournalScreen = React.lazy(() =>
  import('./screens/JournalScreen').then((m) => ({ default: m.JournalScreen }))
);
const AlbumScreen = React.lazy(() =>
  import('./screens/AlbumScreen').then((m) => ({ default: m.AlbumScreen }))
);
const TeleprompterScreen = React.lazy(() =>
  import('./screens/TeleprompterScreen').then((m) => ({ default: m.TeleprompterScreen }))
);
const KnowledgeScreen = React.lazy(() =>
  import('./screens/KnowledgeScreen').then((m) => ({ default: m.KnowledgeScreen }))
);
const SettingsScreen = React.lazy(() =>
  import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen }))
);
const CommitmentScreen = React.lazy(() =>
  import('./screens/CommitmentScreen').then((m) => ({ default: m.CommitmentScreen }))
);
const NotificationsScreen = React.lazy(() =>
  import('./screens/NotificationsScreen').then((m) => ({ default: m.NotificationsScreen }))
);
const InteractiveUserGuide = React.lazy(() =>
  import('./components/InteractiveUserGuide').then((m) => ({ default: m.InteractiveUserGuide }))
);

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({ theme: 'dark', accentColor: '#0b57d0' });
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return sanitizeRoute(hash);
    return sanitizeRoute(sessionStorage.getItem('manifest_active_tab') || 'home');
  });
  const [routeState, setRouteState] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Quick theme toggle handler (light <-> dark)
  const handleQuickThemeToggle = useCallback(async () => {
    const nextTheme: AppSettings['theme'] = isDark ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    await setSetting('theme', nextTheme);
    const darkNow = applyTheme(nextTheme);
    setIsDark(darkNow);
  }, [isDark, settings]);

  // Apply theme & sacred accent whenever settings change
  useEffect(() => {
    const darkNow = applyTheme(settings.theme);
    setIsDark(darkNow);
    applyAccentColor(settings.accentColor);

    if (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const sysDark = applyTheme('system');
        setIsDark(sysDark);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme, settings.accentColor]);

  // Load initial data
  const refreshData = useCallback(async () => {
    try {
      await purgeSampleData();
      const p = await getProfile();
      setProfile(p || null);

      await initializeDefaultGoalsIfEmpty();
      const g = await getAllGoals();
      setGoals(g);

      const s = await getStreak('scripting');
      setStreakCount(s.count || 0);

      const sett = await getAppSettings();
      setSettings(sett);

      const darkNow = applyTheme(sett.theme);
      setIsDark(darkNow);
      applyAccentColor(sett.accentColor);

      const quota = await checkStorageQuota();
      setStorageInfo(quota);

      // Check on-open reminders safely if notifications are permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        const entries = await getAllJournalEntries();
        const nowMs = Date.now();
        let shouldRemind = false;
        if (entries.length > 0) {
          const latest = entries.reduce((prev, curr) =>
            new Date(curr.createdAt).getTime() > new Date(prev.createdAt).getTime() ? curr : prev
          );
          const diffHours = (nowMs - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60);
          if (diffHours >= 24) shouldRemind = true;
        }

        if (shouldRemind && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('📖 Time to journal your day!', {
              body: 'Anchor what you accomplished today and keep your manifestation momentum active.',
              icon: '/icons/icon-192.png',
              tag: 'journal-reminder-onopen',
            });
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Run background IDB integrity check
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        const req = window.indexedDB.open('manifest-journal-db');
        req.onsuccess = () => {
          runIntegrityCheck(req.result).catch((err: any) =>
            console.warn('[Integrity Check] Skipped:', err)
          );
        };
      } catch (e) {
        // Suppressed
      }
    }
  }, [refreshData]);

  // Handle hash changes safely with router guard
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentRoute(sanitizeRoute(hash));
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string, state?: any) => {
    const safeRoute = sanitizeRoute(route);
    setCurrentRoute(safeRoute);
    setRouteState(state || null);
    window.location.hash = `#${safeRoute}`;
    if (['scripting', 'journal', 'album', 'teleprompter', 'home'].includes(safeRoute)) {
      sessionStorage.setItem('manifest_active_tab', safeRoute);
    }
  };

  // Profile Onboarding check:
  // If not yet onboarded and not loading, show Commitment screen
  const isCommitted = !!profile;

  // Active Goals for Home
  const todayGoal = goals.find((g) => g.type === 'today' && g.status === 'active');
  const monthGoal = goals.find((g) => g.type === 'month' && g.status === 'active');

  const getPageTitle = (route: string) => {
    switch (route) {
      case 'home':
        return 'Manifest Journal';
      case 'scripting':
        return 'Scripting';
      case 'journal':
        return 'Journal';
      case 'album':
        return 'Album';
      case 'teleprompter':
        return 'Teleprompter';
      case 'goals':
        return 'Goals';
      case 'knowledge':
        return 'Knowledge';
      case 'settings':
        return 'Settings';
      case 'notifications':
        return 'Ritual Alerts & Push';
      case 'commitment':
        return 'Commitment';
      default:
        return 'Manifest Journal';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9f8] dark:bg-black p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-accent text-white flex items-center justify-center shadow-xl animate-pulse mb-4">
          <img src="/icons/icon-96.png" alt="Manifest" width="48" height="48" className="w-12 h-12" />
        </div>
        <p className="text-sm font-semibold hero-text">
          Opening Your Sacred Space...
        </p>
      </div>
    );
  }

  // Show Commitment onboarding if user hasn't committed yet
  if (!isCommitted && currentRoute !== 'knowledge') {
    return (
      <div className="min-h-screen bg-[#fcf9f8] dark:bg-black ambient-gradient">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          }
        >
          <CommitmentScreen
            existingProfile={null}
            onComplete={async (newProfile) => {
              setProfile(newProfile);
              await refreshData();
              navigateTo('home');
            }}
          />
        </React.Suspense>
      </div>
    );
  }

  const showBottomNav = ['home', 'scripting', 'journal', 'album', 'teleprompter'].includes(
    currentRoute
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f8] dark:bg-black ambient-gradient text-[#1b1b1c] dark:text-white transition-colors">
      <OfflineIndicator />

      {/* Top Application Bar */}
      <TopBar
        title={getPageTitle(currentRoute)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        streakCount={streakCount}
        profile={profile}
        onAvatarClick={() => navigateTo('settings')}
        isDark={isDark}
        onToggleTheme={handleQuickThemeToggle}
      />

      {/* Navigation Slide-Over Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeRoute={currentRoute}
        onNavigate={(route) => navigateTo(route)}
        profile={profile}
        storageInfo={storageInfo}
        streakCount={streakCount}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4">
        {currentRoute === 'home' && (
          <HomeScreen
            profile={profile}
            todayGoal={todayGoal}
            monthGoal={monthGoal}
            streakCount={streakCount}
            onNavigate={navigateTo}
            onRefreshData={refreshData}
          />
        )}

        <React.Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          }
        >
          {currentRoute === 'scripting' && (
            <ScriptingScreen initialState={routeState} onRefreshData={refreshData} />
          )}

          {currentRoute === 'journal' && (
            <JournalScreen
              initialState={routeState}
              onRefreshData={refreshData}
            />
          )}

          {currentRoute === 'album' && (
            <AlbumScreen
              initialOpenCamera={routeState?.openCamera || false}
              onRefreshData={refreshData}
            />
          )}

          {currentRoute === 'teleprompter' && (
            <TeleprompterScreen
              onRecordingSaved={refreshData}
              onNavigateToAlbum={() => navigateTo('album')}
            />
          )}

          {currentRoute === 'goals' && (
            <GoalsScreen onRefreshData={refreshData} />
          )}

          {currentRoute === 'knowledge' && (
            <KnowledgeScreen onOpenGuide={() => setIsGuideOpen(true)} />
          )}

          {currentRoute === 'settings' && (
            <SettingsScreen
              profile={profile}
              onOpenCovenant={() => navigateTo('commitment')}
              onSettingsChanged={(newSett) => setSettings(newSett)}
            />
          )}

          {currentRoute === 'notifications' && (
            <NotificationsScreen onNavigateHome={() => navigateTo('home')} />
          )}

          {currentRoute === 'commitment' && (
            <CommitmentScreen
              existingProfile={profile}
              isReadOnly={true}
              onComplete={() => navigateTo('settings')}
            />
          )}
        </React.Suspense>
      </main>

      {/* Fixed Bottom Navigation Tabs */}
      {showBottomNav && (
        <BottomNav
          activeTab={currentRoute}
          onTabChange={(tab) => navigateTo(tab)}
        />
      )}

      {/* Interactive Step-by-Step User Guide Modal */}
      {isGuideOpen && (
        <React.Suspense fallback={null}>
          <InteractiveUserGuide
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            onNavigate={(route) => navigateTo(route)}
          />
        </React.Suspense>
      )}
    </div>
  );
}
