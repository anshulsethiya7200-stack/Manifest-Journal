import React, { useState, useRef, useEffect } from 'react';
import { TeleprompterScript, AlbumMedia } from '../types';
import { saveTeleprompterScript, saveAlbumMedia } from '../lib/storage';
import { saveMediaFile } from '../lib/opfs';
import {
  Play,
  Pause,
  Square,
  Sliders,
  Tv,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface TeleprompterScreenProps {
  onRecordingSaved?: () => void;
  onNavigateToAlbum?: () => void;
}

const PRESET_SCRIPTS = [
  {
    title: 'Abundance & Financial Flow',
    content:
      'I am a clear conduit for limitless abundance and prosperity. Wealth flows toward me in avalanches of ease and synchronicity. Every dollar I invest in my growth returns tenfold. I anchor financial sovereignty with profound gratitude and generous grace.',
  },
  {
    title: 'Self-Certainty & Sacred Purpose',
    content:
      'I completely trust my intuition, my timing, and my highest alignment. I release all need for external validation. The universe is actively conspiring in my favor. Every door that opens for me is aligned with my greatest creative contribution.',
  },
  {
    title: 'Quantum Physical Vitality',
    content:
      'My mind is tranquil, my body is resilient, and my energy is radiant. Deep peace permeates every cell of my being. I awaken with vibrant enthusiasm, moving through challenges with unshakeable poise and clear conviction.',
  },
];

export const TeleprompterScreen: React.FC<TeleprompterScreenProps> = ({
  onRecordingSaved,
  onNavigateToAlbum,
}) => {
  const [mode, setMode] = useState<'setup' | 'recording'>('setup');
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [speed, setSpeed] = useState(1.0); // 0.5 to 3.0

  // Teleprompter Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Refs for media and animation
  const videoFeedRef = useRef<HTMLVideoElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const scrollPosRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  wordsRef.current = scriptText.trim().split(/\s+/);

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      stopCameraAndLoop();
    };
  }, []);

  const stopCameraAndLoop = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Launch Teleprompter Mode
  const startTeleprompterSession = async () => {
    if (!scriptText.trim()) {
      alert('Please enter or select a script to speak.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      setMode('recording');
      setIsRecording(false);
      setIsPaused(false);
      scrollPosRef.current = 0;
      setCurrentWordIndex(0);

      // Save script to IDB
      const scriptRecord: TeleprompterScript = {
        id: crypto.randomUUID(),
        title: scriptTitle || 'Spoken Affirmation',
        content: scriptText,
        speed,
        createdAt: new Date().toISOString(),
      };
      await saveTeleprompterScript(scriptRecord);
    } catch (err) {
      console.warn('Teleprompter camera error:', err);
      alert('Could not start camera feed. Please verify camera and microphone permissions.');
    }
  };

  // Attach stream when video element renders
  useEffect(() => {
    if (mode === 'recording' && videoFeedRef.current && streamRef.current) {
      videoFeedRef.current.srcObject = streamRef.current;
    }
  }, [mode]);

  // Start MediaRecorder & Scroll Loop
  const beginRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const filename = await saveMediaFile(videoBlob, 'teleprompter-recordings', 'webm');
      const albumRecord: AlbumMedia = {
        id: crypto.randomUUID(),
        filename,
        type: 'recording',
        source: 'teleprompter',
        takenAt: new Date().toISOString(),
      };
      await saveAlbumMedia(albumRecord);

      stopCameraAndLoop();
      setMode('setup');
      onRecordingSaved?.();
      onNavigateToAlbum?.();
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setIsPaused(false);

    // Start RAF scroll
    startScrollLoop();
  };

  const startScrollLoop = () => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!isPaused && scrollContainerRef.current) {
        // Base scroll pixels per second = 28 * speed
        const pixelsToScroll = 28 * speed * delta;
        scrollPosRef.current += pixelsToScroll;
        scrollContainerRef.current.scrollTop = scrollPosRef.current;

        // Calculate highlighted word index based on scroll position
        const totalHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        if (totalHeight > 0) {
          const ratio = Math.min(1, Math.max(0, scrollPosRef.current / totalHeight));
          const idx = Math.floor(ratio * wordsRef.current.length);
          setCurrentWordIndex(idx);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
  };

  const togglePause = () => {
    if (!recorderRef.current) return;
    if (isPaused) {
      recorderRef.current.resume();
      setIsPaused(false);
    } else {
      recorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const finishRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    } else {
      stopCameraAndLoop();
      setMode('setup');
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {mode === 'setup' ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold hero-text flex items-center gap-2">
              <Tv className="w-6 h-6 text-accent" />
              <span>Spoken Teleprompter</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Read your affirmations aloud on camera. Speak with certainty to rewire subconscious beliefs.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Preset Affirmation:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCRIPTS.map((ps) => (
                <button
                  key={ps.title}
                  onClick={() => {
                    setScriptTitle(ps.title);
                    setScriptText(ps.content);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    scriptTitle === ps.title
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {ps.title}
                </button>
              ))}
            </div>
          </div>

          {/* Script Editor Card */}
          <div className="bg-white dark:bg-[#1d2024] p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Script Title
              </label>
              <input
                type="text"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                placeholder="Title your affirmation..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Affirmation Text</span>
                <span className="text-[10px] text-slate-400">
                  {wordsRef.current.length} words
                </span>
              </label>
              <textarea
                rows={5}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm leading-relaxed focus:outline-hidden focus:ring-2 ring-accent"
              />
            </div>

            {/* Speed Controller */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent" />
                  <span>Scroll Speed</span>
                </span>
                <span className="font-mono bg-accent-container text-accent px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {speed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color,#0b57d0)]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Gentle / Reflective (0.5x)</span>
                <span>Natural Cadence (1.0x)</span>
                <span>Fast Pace (3.0x)</span>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={startTeleprompterSession}
            className="w-full py-4 rounded-full bg-accent hover-bg-accent text-white font-bold text-sm shadow-xl shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Teleprompter & Camera</span>
          </button>
        </div>
      ) : (
        /* RECORDING / OVERLAY MODE */
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 text-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between z-20">
            <span className="text-xs font-semibold px-3 py-1 bg-black/60 rounded-full border border-white/20 backdrop-blur-xs">
              {scriptTitle} · {speed.toFixed(1)}x
            </span>
            <button
              onClick={finishRecording}
              className="px-3 py-1.5 rounded-full bg-white/20 text-xs font-semibold hover:bg-white/30"
            >
              Exit
            </button>
          </div>

          {/* Video Feed Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              ref={videoFeedRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Contrast Scrim for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/65" />
          </div>

          {/* Center Scrolling Script Overlay */}
          <div
            ref={scrollContainerRef}
            className="relative z-10 flex-1 overflow-y-auto no-scrollbar max-w-lg mx-auto w-full px-6 py-24 text-center select-none"
            style={{ scrollBehavior: 'auto' }}
          >
            <div className="space-y-4">
              <p className="text-xl sm:text-2xl font-bold leading-relaxed tracking-wide text-white/70">
                {wordsRef.current.map((word, idx) => {
                  const isCurrent = idx === currentWordIndex;
                  return (
                    <span
                      key={idx}
                      className={`inline-block mx-1 transition-colors duration-150 ${
                        isCurrent
                          ? 'text-amber-300 font-extrabold scale-110 drop-shadow-[0_0_12px_rgba(255,234,0,0.8)]'
                          : 'text-white/80'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="relative z-20 flex items-center justify-center gap-6 pb-6">
            {!isRecording ? (
              <button
                onClick={beginRecording}
                className="px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                <span>Begin Recording</span>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePause}
                  className="w-13 h-13 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/40 active:scale-95 transition"
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6" />}
                </button>

                <button
                  onClick={finishRecording}
                  className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 font-bold text-xs flex items-center gap-2 shadow-xl active:scale-95 transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Finish & Save to Album</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
