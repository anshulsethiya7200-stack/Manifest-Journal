import React from 'react';
import { Profile } from '../types';
import {
  Menu,
  Flame,
  PenTool,
  BookOpen,
  Image as ImageIcon,
  Tv,
  Sun,
  Moon,
} from 'lucide-react';

interface TopBarProps {
  title: string;
  onOpenDrawer: () => void;
  streakCount: number;
  profile: Profile | null;
  onAvatarClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  rightActions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onOpenDrawer,
  streakCount,
  profile,
  onAvatarClick,
  isDark = false,
  onToggleTheme,
  rightActions,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDrawer}
          className="min-w-[44px] min-h-[44px] -ml-2 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-[#1b1b1c] dark:text-white truncate max-w-[180px] sm:max-w-xs">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {rightActions}

        {/* Quick Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:opacity-80 active:scale-95 transition"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        )}

        {/* Streak indicator badge */}
        <button
          onClick={onAvatarClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f2daff] dark:bg-[#3f2d4b] text-[#291835] dark:text-[#f3daff] hover:opacity-90 active:scale-95 transition font-semibold text-xs shadow-2xs"
          title={`${streakCount} Day Streak!`}
          aria-label={`${streakCount} day streak`}
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{streakCount}</span>
        </button>

        {/* User avatar */}
        <button
          onClick={onAvatarClick}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center p-0.5 active:scale-95 transition"
          aria-label="Open profile and settings"
        >
          {profile?.selfie ? (
            <img
              src={profile.selfie}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-accent shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {profile?.name ? profile.name[0].toUpperCase() : 'M'}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'scripting', label: 'Scripting', icon: PenTool },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'album', label: 'Album', icon: ImageIcon },
    { id: 'teleprompter', label: 'Teleprompter', icon: Tv },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border-t border-black/5 dark:border-white/5 pb-safe transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center min-h-[44px] py-1 transition-all group"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white shadow-xs scale-105'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? 'text-accent font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
