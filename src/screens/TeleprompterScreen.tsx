import React, { useState, useRef, useEffect } from 'react';
import { TeleprompterScript, AlbumMedia } from '../types';
import { saveTeleprompterScript, saveAlbumMedia } from '../lib/storage';
import { saveMediaFile } from '../lib/opfs';
import { sanitizeText, sanitizeMultilineText } from '../lib/sanitize';
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
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
  };

  // Launch Teleprompter Mode
  const startTeleprompterSession = async () => {
    const cleanContent = sanitizeMultilineText(scriptText).trim();
    if (!cleanContent) {
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
        title: sanitizeText(scriptTitle) || 'Spoken Affirmation',
        content: cleanContent,
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
        // Recalibrated auto-scrolling speed calculation algorithm:
        // At lowest setting (0.5x), provides a buttery-smooth, comfortably slow, and easily readable pace (~8.5 px/sec) without rushing the speaker.
        const basePixelsPerSec = 9.5;
        const speedMultiplier = Math.pow(speed / 0.5, 1.25);
        const pixelsToScroll = basePixelsPerSec * speedMultiplier * delta;
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
                      : 'bg-white dark:bg-black border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {ps.title}
                </button>
              ))}
            </div>
          </div>

          {/* Script Editor Card */}
          <div className="bg-white dark:bg-black p-5 rounded-3xl border border-black/5 dark:border-white/15 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Script Title
              </label>
              <input
                type="text"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                placeholder="Title your affirmation..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 ring-accent"
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
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2 ring-accent"
              />
            </div>

            {/* Speed Controller */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
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
        /* RECORDING / OVERLAY MODE: Repositioned to absolute top of viewport adjacent to front camera area */
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white overflow-hidden animate-in fade-in">
          {/* Video Feed Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              ref={videoFeedRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Contrast Scrim for Text Legibility: Stronger at top right beneath camera notch */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/85" />
          </div>

          {/* Top Bar with Camera Eye-Level Badge */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-1 bg-black/80 rounded-full border border-white/20 backdrop-blur-md text-amber-300 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Eye-Level</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-black/60 rounded-full border border-white/15 backdrop-blur-xs text-white/90">
                {speed.toFixed(1)}x pace
              </span>
            </div>
            <button
              onClick={finishRecording}
              className="px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-semibold hover:bg-white/30 backdrop-blur-xs active:scale-95 transition"
            >
              Exit
            </button>
          </div>

          {/* Top-Pinned Scrolling Script Overlay: Directly adjacent to front camera area */}
          <div className="relative z-20 w-full max-w-lg mx-auto px-4 pt-1">
            <div
              ref={scrollContainerRef}
              className="h-[36vh] sm:h-[40vh] overflow-y-auto no-scrollbar rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 p-5 text-center select-none shadow-2xl"
              style={{ scrollBehavior: 'auto' }}
            >
              <div className="py-6">
                <p className="text-xl sm:text-2xl font-bold leading-relaxed tracking-wide text-white/70">
                  {wordsRef.current.map((word, idx) => {
                    const isCurrent = idx === currentWordIndex;
                    return (
                      <span
                        key={idx}
                        className={`inline-block mx-1 transition-all duration-150 ${
                          isCurrent
                            ? 'text-amber-300 font-extrabold scale-110 drop-shadow-[0_0_14px_rgba(255,234,0,0.9)]'
                            : 'text-white/85'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="relative z-20 flex items-center justify-center gap-6 pb-8 pt-4">
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
