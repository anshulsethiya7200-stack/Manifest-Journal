import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'prominent' | 'compact' | 'drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'drawer') {
      return (
        <button
          onClick={install}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-container text-accent font-medium text-sm hover:opacity-90 transition-all active:scale-95"
        >
          <Download className="w-5 h-5 text-accent" />
          <span>Install Manifest PWA</span>
        </button>
      );
    }

    if (variant === 'prominent') {
      return (
        <div className="pwa-banner-gradient text-white p-4 rounded-3xl shadow-lg flex items-center justify-between gap-3 border border-black/5 dark:border-white/10 transition-all">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-72.png" alt="Manifest" className="w-11 h-11 rounded-2xl shadow" />
            <div>
              <p className="font-semibold text-sm">Install Manifest Journal</p>
              <p className="text-xs text-white/80">Add to home screen for offline access</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-4 py-2 bg-white dark:bg-black/30 text-accent dark:text-white font-bold text-xs rounded-full shadow hover:opacity-90 transition active:scale-95"
          >
            Install
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-container text-accent hover:opacity-90 text-xs font-semibold transition active:scale-95 shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-accent" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'drawer' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-container text-accent font-medium text-sm hover:opacity-90 transition-all active:scale-95"
          >
            <Share className="w-5 h-5 text-accent" />
            <span>Install on iOS</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-subtle bg-accent-container text-accent text-xs font-semibold hover:opacity-90 transition active:scale-95"
          >
            <Share className="w-3.5 h-3.5 text-accent" />
            <span>Add to Home</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1d2024] p-6 shadow-2xl text-[#1b1b1c] dark:text-white">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <img src="/icons/icon-72.png" alt="Manifest" className="w-10 h-10 rounded-2xl" />
                  <h3 className="font-semibold text-base hero-text">Install Manifest Journal</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                To install this PWA on your iPhone or iPad:
              </p>

              <ol className="text-xs space-y-3 text-slate-700 dark:text-slate-200 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1" /> in Safari
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span>Launch Manifest directly from your home screen!</span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 bg-accent hover-bg-accent text-white font-bold text-sm rounded-full shadow transition active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
