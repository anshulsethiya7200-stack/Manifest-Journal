import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  X,
  Clock,
} from 'lucide-react';

interface TeleprompterScreenProps {
  onRecordingSaved?: () => void;
  onNavigateToAlbum?: () => void;
}

const PRESET_SCRIPTS = [
  {
    title: 'Camera Presence & Natural Flow',
    content:
      'Every video starts with a clear idea.\nTake a breath.\nLook into the lens.\nSpeak naturally.\nMake it count.',
  },
  {
    title: 'Abundance & Financial Flow',
    content:
      'I am a clear conduit for limitless abundance and prosperity.\nWealth flows toward me in avalanches of ease and synchronicity.\nEvery dollar I invest in my growth returns tenfold.\nI anchor financial sovereignty with profound gratitude and generous grace.',
  },
  {
    title: 'Self-Certainty & Sacred Purpose',
    content:
      'I completely trust my intuition, my timing, and my highest alignment.\nI release all need for external validation.\nThe universe is actively conspiring in my favor.\nEvery door that opens for me is aligned with my greatest creative contribution.',
  },
  {
    title: 'Quantum Physical Vitality',
    content:
      'My mind is tranquil, my body is resilient, and my energy is radiant.\nDeep peace permeates every cell of my being.\nI awaken with vibrant enthusiasm, moving through challenges with unshakeable poise and clear conviction.',
  },
];

export const TeleprompterScreen: React.FC<TeleprompterScreenProps> = ({
  onRecordingSaved,
  onNavigateToAlbum,
}) => {
  const [mode, setMode] = useState<'setup' | 'recording'>('setup');
  const [scriptTitle, setScriptTitle] = useState(PRESET_SCRIPTS[0].title);
  const [scriptText, setScriptText] = useState(PRESET_SCRIPTS[0].content);
  // Human speaking pace multiplier: 1.0x = 120 Words Per Minute (Average human reading speed)
  const [speed, setSpeed] = useState(1.0);

  // Teleprompter Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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

  // Parse script into clean, readable structured lines
  const lines = useMemo(() => {
    if (!scriptText.trim()) return [];
    const rawSegments = scriptText.includes('\n')
      ? scriptText.split('\n').filter((l) => l.trim().length > 0)
      : scriptText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()) || [scriptText.trim()];

    let currentWordCounter = 0;
    return rawSegments.map((segment) => {
      const words = segment.trim().split(/\s+/).filter(Boolean);
      const startIndex = currentWordCounter;
      currentWordCounter += words.length;
      return {
        text: segment.trim(),
        words,
        startIndex,
        endIndex: Math.max(startIndex, currentWordCounter - 1),
      };
    });
  }, [scriptText]);

  const allWords = useMemo(() => {
    return lines.flatMap((l) => l.words);
  }, [lines]);

  wordsRef.current = allWords;

  // Live recording timer (MM:SS)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
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
      setRecordingSeconds(0);
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
    setRecordingSeconds(0);
    scrollPosRef.current = 0;
    setCurrentWordIndex(0);

    // Start natural human reading scroll loop
    startScrollLoop();
  };

  const startScrollLoop = () => {
    let lastTime = performance.now();
    let accumulatedTime = 0;
    const initialBreathDelay = 1.0; // 1s calm pause to settle gaze on camera

    // Average human speech rate: 120 Words Per Minute at 1.0x
    const targetWPM = Math.max(60, Math.min(220, Math.round(120 * speed)));
    const wordsPerSec = targetWPM / 60;
    const secondsPerWord = 1 / wordsPerSec;

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!isPaused && scrollContainerRef.current) {
        accumulatedTime += delta;

        const effectiveTime = Math.max(0, accumulatedTime - initialBreathDelay);
        const wordCount = wordsRef.current.length || 1;
        const totalReadingDuration = wordCount * secondsPerWord;

        // Current word index advances in sync with natural human speaking speed
        const activeIdx = Math.min(
          wordCount - 1,
          Math.floor(effectiveTime * wordsPerSec)
        );
        setCurrentWordIndex(activeIdx);

        // Smooth continuous scroll proportional to total speech duration
        const maxScroll =
          scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;

        if (maxScroll > 0) {
          const progress = Math.min(1, effectiveTime / totalReadingDuration);
          const targetScroll = progress * maxScroll;
          // Smooth glide toward target scroll
          scrollPosRef.current += (targetScroll - scrollPosRef.current) * 0.12;
          scrollContainerRef.current.scrollTop = scrollPosRef.current;
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
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Read affirmations aloud directly on camera. Speak with certainty and natural pacing to rewire subconscious belief.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
                  {allWords.length} words • ~{Math.max(1, Math.ceil((allWords.length / Math.round(120 * speed)) * 60))}s speaking time
                </span>
              </label>
              <textarea
                rows={5}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2 ring-accent"
              />
            </div>

            {/* Natural Speed Controller */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent" />
                  <span>Reading Speed</span>
                </span>
                <span className="font-mono bg-accent-container text-accent px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  {Math.round(120 * speed)} Words / Min ({speed.toFixed(1)}x)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color,#0b57d0)]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Reflective (60 WPM)</span>
                <span className="text-accent font-semibold">Natural Human (120 WPM)</span>
                <span>Brisk Pace (216 WPM)</span>
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
        /* RECORDING / OVERLAY MODE: Styled like pro teleprompter matching reference */
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
            {/* Contrast Scrim for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/45 to-black/85" />
          </div>

          {/* Top Bar with Exit, Live Timer, and Cadence Badge */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-3 pb-1">
            <button
              onClick={finishRecording}
              className="p-2 rounded-full bg-black/60 border border-white/20 text-white/90 hover:bg-black/80 active:scale-95 transition"
              aria-label="Exit Teleprompter"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Live Recording Timer */}
            <div className="flex items-center gap-2 px-3.5 py-1 bg-black/80 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRecording
                    ? isPaused
                      ? 'bg-amber-400'
                      : 'bg-rose-500 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="font-mono text-xs font-bold text-white tracking-wider">
                {isRecording ? formatTimer(recordingSeconds) : 'Ready'}
              </span>
            </div>

            {/* Natural WPM Badge */}
            <div className="text-[11px] font-bold px-3 py-1 bg-black/70 rounded-full border border-white/20 text-amber-300 backdrop-blur-md">
              {Math.round(120 * speed)} WPM
            </div>
          </div>

          {/* Top-Pinned Scrolling Script Overlay: Styled with vertical accent line and natural phrasing */}
          <div className="relative z-20 w-full max-w-lg mx-auto px-4 pt-1">
            <div
              ref={scrollContainerRef}
              className="h-[44vh] sm:h-[48vh] overflow-y-auto no-scrollbar rounded-3xl bg-black/70 backdrop-blur-md border border-white/15 p-4 select-none shadow-2xl"
              style={{ scrollBehavior: 'auto' }}
            >
              <div className="pt-2 pb-52 space-y-3">
                {lines.map((line, lineIdx) => {
                  const isLineActive =
                    currentWordIndex >= line.startIndex && currentWordIndex <= line.endIndex;
                  const isLinePast = currentWordIndex > line.endIndex;

                  return (
                    <div
                      key={lineIdx}
                      className={`transition-all duration-200 pl-3.5 py-1 border-l-2 text-left ${
                        isLineActive
                          ? 'border-accent bg-white/5 rounded-r-xl'
                          : isLinePast
                          ? 'border-white/10'
                          : 'border-white/20'
                      }`}
                    >
                      <p
                        className={`text-xl sm:text-2xl leading-relaxed tracking-wide transition-all ${
                          isLineActive
                            ? 'text-white font-bold scale-[1.01]'
                            : isLinePast
                            ? 'text-white/40 font-medium'
                            : 'text-white/70 font-semibold'
                        }`}
                      >
                        {line.words.map((word, wIdx) => {
                          const wordGlobalIdx = line.startIndex + wIdx;
                          const isWordCurrent = wordGlobalIdx === currentWordIndex;
                          return (
                            <span
                              key={wIdx}
                              className={`inline-block mr-1.5 transition-colors duration-100 ${
                                isWordCurrent
                                  ? 'text-amber-300 font-extrabold underline decoration-amber-400 decoration-2 underline-offset-4 drop-shadow-[0_0_8px_rgba(255,234,0,0.6)]'
                                  : isLineActive
                                  ? 'text-white'
                                  : ''
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  );
                })}
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

