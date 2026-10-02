import React, { useState, useEffect } from 'react';
import { Profile, AppSettings, StorageEstimateInfo } from '../types';
import { getAppSettings, setSetting, clearAllDatabase, checkStorageQuota } from '../lib/storage';
import { exportAllDataToZip, clearAllMediaFiles } from '../lib/opfs';
import { applyTheme, applyAccentColor, SACRED_ACCENT_COLORS } from '../lib/theme';
import {
  Sun,
  Moon,
  Laptop,
  Palette,
  Download,
  Trash2,
  HardDrive,
  Bell,
  Github,
  Coffee,
  FileCheck,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface SettingsScreenProps {
  profile: Profile | null;
  onOpenCovenant: () => void;
  onSettingsChanged: (newSettings: AppSettings) => void;
  initialSettings?: AppSettings;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  onOpenCovenant,
  onSettingsChanged,
  initialSettings,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => initialSettings || { theme: 'system', accentColor: '#0b57d0' });
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [customColor, setCustomColor] = useState(() => initialSettings?.accentColor || '#0b57d0');

  useEffect(() => {
    (async () => {
      const s = await getAppSettings();
      setSettings(s);
      setCustomColor(s.accentColor || '#0b57d0');
      const storage = await checkStorageQuota();
      setStorageInfo(storage);
    })();
  }, []);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setCustomColor(initialSettings.accentColor);
    }
  }, [initialSettings]);

  const handleThemeChange = async (theme: AppSettings['theme']) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    await setSetting('theme', theme);
    applyTheme(theme);
    onSettingsChanged(updated);
  };

  const handleColorChange = async (colorHex: string) => {
    const updated = { ...settings, accentColor: colorHex };
    setSettings(updated);
    setCustomColor(colorHex);
    await setSetting('accentColor', colorHex);
    applyAccentColor(colorHex);
    onSettingsChanged(updated);
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      alert('Daily reminders are active for 7:00 AM and 8:00 PM.');
      setNotificationsEnabled(true);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            payload: {
              title: 'Manifest Journal ✨',
              body: 'Daily reminders activated. Stay anchored to your morning & evening rituals.',
              delay: 1000,
            },
          });
        }
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await exportAllDataToZip();
      const todayDate = new Date().toISOString().split('T')[0];
      const filename = `manifest-journal-export-${todayDate}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate export archive. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllDatabase();
      await clearAllMediaFiles();
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Clear error:', err);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold hero-text">
          Settings & Local Vault
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Zero cloud transmission. Manage your appearance, local files, and exported data.
        </p>
      </div>

      {/* Signed Covenant Card */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-container text-accent flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
              Signed Covenant
            </h3>
            <p className="text-[11px] text-slate-500">
              {profile ? `Committed on ${new Date(profile.committedAt).toLocaleDateString()}` : 'Not sealed yet'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCovenant}
          className="px-4 py-2 rounded-full bg-accent-container text-accent text-xs font-bold hover:opacity-90 transition active:scale-95"
        >
          View Vow
        </button>
      </div>

      {/* Appearance & Theme Mode */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Sun className="w-4 h-4 text-accent" />
            <span>Appearance Mode</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {settings.theme === 'dark' ? 'Obsidian Black Night' : settings.theme === 'light' ? 'Day Clarity' : 'Device Auto'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'light', label: 'Light', desc: 'Crisp Day', icon: Sun },
            { id: 'dark', label: 'Dark', desc: 'Obsidian Night', icon: Moon },
            { id: 'system', label: 'System', desc: 'Device Sync', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = settings.theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleThemeChange(item.id as AppSettings['theme'])}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-semibold gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-accent bg-accent-container text-accent shadow-sm ring-2 ring-accent font-extrabold'
                    : 'border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-950 font-semibold'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-accent stroke-[2.5]' : 'text-slate-500 dark:text-white stroke-[1.8]'}`} />
                <span className="font-bold">{item.label}</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-400">{item.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Sacred Accent Color Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/15">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-accent" />
              <span>Sacred Accent Colour</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Chakra & Intention Resonances
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Choose the energetic resonance that anchors your goals, badges, icons, and primary buttons.
          </p>

          {/* 8 Sacred Preset Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {SACRED_ACCENT_COLORS.map((c) => {
              const isSelected = settings.accentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => handleColorChange(c.hex)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group active:scale-95 ${
                    isSelected
                      ? 'border-accent bg-accent-container shadow-sm ring-2 ring-accent'
                      : 'border-slate-200 dark:border-white/15 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{ backgroundColor: c.hex }}
                      className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </span>
                    <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-accent font-extrabold' : 'text-slate-400 dark:text-slate-400'}`}>
                      {c.chakra.split(' ')[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {c.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Color Wheel Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black mt-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    handleColorChange(e.target.value);
                  }}
                  className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                  title="Choose custom sacred frequency"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Custom Vibration
                </span>
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomColor(val);
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      handleColorChange(val);
                    }
                  }}
                  placeholder="#0b57d0"
                  className="w-24 px-2 py-0.5 mt-0.5 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-zinc-900 text-[11px] font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 ring-accent uppercase"
                />
              </div>
            </div>

            <button
              onClick={() => handleColorChange(customColor)}
              className="px-4 py-2 rounded-full bg-accent text-white text-xs font-bold shadow-md hover-bg-accent transition active:scale-95"
            >
              Apply Hex
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl border border-dashed border-accent-subtle bg-accent-container dark:bg-black/90 space-y-3 mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-accent uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Live Resonance Preview</span>
              </span>
              <span className="font-mono text-[10px] text-accent font-bold">{settings.accentColor}</span>
            </div>

            <h4 className="hero-text text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Sacred Alignment Activated</span>
            </h4>

            <p className="text-xs text-slate-700 dark:text-white leading-relaxed font-medium">
              "The buttons, hero text, and icons dynamically change to your chosen sacred frequency."
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button className="px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Primary Button</span>
              </button>
              <button className="px-4 py-2 rounded-full bg-accent-container text-accent border border-accent-subtle text-xs font-bold active:scale-95 transition flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-accent" />
                <span>Accent Button</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-xs">
                <Palette className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Quota & Privacy */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-accent uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-accent" />
            <span>Storage Used/Available</span>
          </span>
          <span className="normal-case font-mono text-slate-500">
            {storageInfo
              ? `${((storageInfo.usage || 0) / (1024 * 1024)).toFixed(1)} MB / ${storageInfo.remainingMb} MB`
              : 'Checking...'}
          </span>
        </div>

        {storageInfo && (
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  storageInfo.isLowSpace ? 'bg-amber-500' : 'bg-accent'
                }`}
                style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }}
              />
            </div>
            {storageInfo.isLowSpace && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Low storage space detected (&lt; 500 MB remaining).</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>All photos, videos, and entries remain 100% on your device.</span>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-container text-accent flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
              Daily Ritual Alerts
            </h3>
            <p className="text-[11px] text-slate-500">
              Morning goals (7:00 AM) & Evening journaling (8:00 PM)
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleNotifications}
          className={`px-4 py-2 rounded-full text-xs font-bold transition active:scale-95 ${
            notificationsEnabled
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-accent hover-bg-accent text-white shadow-xs'
          }`}
        >
          {notificationsEnabled ? 'Active ✓' : 'Enable'}
        </button>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/10 dark:border-white/15 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
          <Download className="w-4 h-4" />
          <span>Complete Data Backup</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Export all your goals, journal reflections, scripting pages, and OPFS media into a single offline <strong>.zip</strong> archive.
        </p>

        <button
          disabled={isExporting}
          onClick={handleExportData}
          className="w-full py-3.5 rounded-full bg-accent hover-bg-accent text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating ZIP Archive...' : 'Download Full Archive (.zip)'}</span>
        </button>
      </div>

      {/* Community Links: GitHub & BMC */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="https://github.com/anshulsethiya7200-stack/Manifest-Journal"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white dark:bg-black p-4 rounded-3xl border border-black/10 dark:border-white/15 shadow-2xs hover:border-accent-subtle hover:shadow-xs transition-all active:scale-95 flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 group"
          aria-label="View source code on GitHub"
        >
          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Github className="w-4 h-4 text-slate-800 dark:text-white" />
          </div>
          <span>GitHub Repo</span>
          <ExternalLink className="w-3 h-3 text-slate-400 ml-auto group-hover:text-accent transition-colors" />
        </a>

        <a
          href="https://buymeacoffee.com/anshuljain"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white dark:bg-black p-4 rounded-3xl border border-black/10 dark:border-white/15 shadow-2xs hover:border-amber-400/50 hover:shadow-xs transition-all active:scale-95 flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 group"
          aria-label="Support the app on Buy Me a Coffee"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <span>Support App</span>
          <ExternalLink className="w-3 h-3 text-slate-400 ml-auto group-hover:text-amber-500 transition-colors" />
        </a>
      </div>

      {/* Clear All Data Danger Zone */}
      <div className="pt-2">
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full py-3 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Data & Reset App</span>
        </button>
      </div>

      {/* Clear Data Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-black border border-black/10 dark:border-white/15 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-[#1b1b1c] dark:text-white">
              Permanently Clear All Data?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will irreversibly delete all goals, journal entries, scripting pages, media files from OPFS, and reset your covenant.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
