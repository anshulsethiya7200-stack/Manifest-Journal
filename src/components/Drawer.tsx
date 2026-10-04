import React from 'react';
import { Profile, StorageEstimateInfo } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Home,
  Target,
  BookOpen,
  FileCheck,
  Settings,
  X,
  HardDrive,
  Sparkles,
  Flame,
  Compass,
} from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
  onNavigate: (route: string) => void;
  profile: Profile | null;
  storageInfo: StorageEstimateInfo | null;
  streakCount: number;
  onOpenGuide?: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  activeRoute,
  onNavigate,
  profile,
  storageInfo,
  streakCount,
  onOpenGuide,
}) => {
  if (!isOpen) return null;

  const handleNav = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Surface */}
      <div className="relative w-80 max-w-[85vw] bg-white dark:bg-black border-r border-black/5 dark:border-white/15 text-[#1b1b1c] dark:text-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300">
        <div>
          {/* Header Profile Section */}
          <div className="p-6 hero-gradient border-b border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </span>
                <span className="font-extrabold text-base tracking-tight hero-text">
                  Manifest Journal
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profile ? (
              <div className="flex items-center gap-3">
                {profile.selfie ? (
                  <img
                    src={profile.selfie}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-accent shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent-container text-accent font-bold text-lg flex items-center justify-center">
                    {profile.name ? profile.name[0].toUpperCase() : 'M'}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm leading-tight text-[#1b1b1c] dark:text-white">
                    {profile.name || 'Soul Manifestor'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {streakCount} Day Streak
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Welcome to your sacred manifestation space.
              </div>
            )}
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-6">
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                My Journey
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('home')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeRoute === 'home'
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Home className={`w-4 h-4 ${activeRoute === 'home' ? 'text-white' : 'text-accent'}`} />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => handleNav('goals')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeRoute === 'goals'
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Target className={`w-4 h-4 ${activeRoute === 'goals' ? 'text-white' : 'text-accent'}`} />
                  <span>Goals</span>
                </button>
              </div>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Learn & Anchor
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('knowledge')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeRoute === 'knowledge'
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeRoute === 'knowledge' ? 'text-white' : 'text-accent'}`} />
                  <span>Knowledge & Guide</span>
                </button>
                <button
                  onClick={() => handleNav('commitment')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeRoute === 'commitment'
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <FileCheck className={`w-4 h-4 ${activeRoute === 'commitment' ? 'text-white' : 'text-accent'}`} />
                  <span>View Covenant</span>
                </button>
                {onOpenGuide && (
                  <button
                    onClick={() => {
                      onOpenGuide();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                  >
                    <Compass className="w-4 h-4 text-accent" />
                    <span>Interactive App Guide</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                App & Data
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeRoute === 'settings'
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Settings className={`w-4 h-4 ${activeRoute === 'settings' ? 'text-white' : 'text-accent'}`} />
                  <span>Theme, Accent & Vault</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <PWAInstallButton variant="drawer" />
            </div>
          </nav>
        </div>

        {/* Footer info: storage */}
        <div className="p-4 border-t border-black/5 dark:border-white/15 bg-slate-50/50 dark:bg-black text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-accent" />
              Storage Used/Available
            </span>
            <span className="font-mono text-[11px]">
              {storageInfo
                ? `${((storageInfo.usage || 0) / (1024 * 1024)).toFixed(1)} MB / ${storageInfo.remainingMb} MB`
                : 'Checking...'}
            </span>
          </div>
          {storageInfo && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  storageInfo.isLowSpace ? 'bg-amber-500' : 'bg-accent'
                }`}
                style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
            Local-First & Sandbox Encrypted. No Cloud Sync.
          </p>
        </div>
      </div>
    </div>
  );
};
