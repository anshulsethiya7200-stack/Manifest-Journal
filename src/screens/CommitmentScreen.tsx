import React, { useState, useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { Profile, Gender } from '../types';
import { saveProfile } from '../lib/storage';
import { sanitizeText, sanitizeMultilineText } from '../lib/sanitize';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface CommitmentScreenProps {
  existingProfile?: Profile | null;
  onComplete: (profile: Profile) => void;
  isReadOnly?: boolean;
}

export const HARDCODED_PLEDGE =
  'I hereby commit to my highest self and the unseen forces of reality. I vow to write, align, and act in accordance with the truth of my desires. My thoughts forge my reality; my words anchor my vision; my daily rituals will not waver. Through gratitude, presence, and disciplined scripting, I bring my deepest manifestations into tangible existence.';

export const CommitmentScreen: React.FC<CommitmentScreenProps> = ({
  existingProfile,
  onComplete,
  isReadOnly = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(isReadOnly ? 2 : 1);

  // Step 1 Fields
  const [name, setName] = useState(existingProfile?.name || '');
  const [dob, setDob] = useState(existingProfile?.dob || '');
  const [gender, setGender] = useState<Gender>(existingProfile?.gender || 'female');
  const [selfie, setSelfie] = useState<string>(existingProfile?.selfie || '');

  // Step 2 Fields
  const [quitClause, setQuitClause] = useState(
    existingProfile?.quitClause || ''
  );
  const [signatureData, setSignatureData] = useState<string>(existingProfile?.signature || '');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live Selfie Camera Modal State
  const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);

  // Signature Pad ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadInstance = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Strict Media Stream Cleanup on unmount for selfie camera
  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Selfie track stop error:', e);
        }
      });
      selfieStreamRef.current = null;
    }
    setIsSelfieCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopSelfieCamera();
    };
  }, []);

  // Launch live selfie camera
  const startSelfieCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
      });
      selfieStreamRef.current = stream;
      setIsSelfieCameraOpen(true);
      setTimeout(() => {
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn('Selfie camera error:', err);
      alert('Could not access front camera. Please allow camera permissions or upload a profile picture.');
    }
  };

  // Capture frame from selfie camera
  const captureSelfiePhoto = () => {
    if (!selfieVideoRef.current) return;
    const video = selfieVideoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop square
      const startX = ((video.videoWidth || size) - size) / 2;
      const startY = ((video.videoHeight || size) - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setSelfie(dataUrl);
    }
    stopSelfieCamera();
  };

  // Initialize signature pad on step 2
  useEffect(() => {
    if (step === 2 && canvasRef.current && !isReadOnly) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(ratio, ratio);

      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#0b57d0';
      const penColor = isDark ? '#ffffff' : accent;

      signaturePadInstance.current = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor,
      });

      if (signatureData) {
        signaturePadInstance.current.fromDataURL(signatureData);
      }
    }

    return () => {
      if (signaturePadInstance.current) {
        signaturePadInstance.current.off();
      }
    };
  }, [step, isReadOnly]);

  // Handle TTS speech synthesis
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(HARDCODED_PLEDGE);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Selfie selection
  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelfie(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSignature = () => {
    if (signaturePadInstance.current) {
      signaturePadInstance.current.clear();
      setSignatureData('');
    }
  };

  // Submit Step 2 to Step 3
  const handleSealCovenant = async () => {
    let finalSignature = signatureData;
    if (signaturePadInstance.current && !signaturePadInstance.current.isEmpty()) {
      finalSignature = signaturePadInstance.current.toDataURL('image/png');
    }

    if (!finalSignature) {
      alert('Please provide your signature on the pad to seal your pledge.');
      return;
    }

    if (!quitClause.trim()) {
      alert('Please write what you will quit if you break your pledge.');
      return;
    }

    const profile: Profile = {
      id: 'user-profile',
      name: sanitizeText(name) || 'Manifestor',
      dob: sanitizeText(dob),
      gender,
      selfie,
      pledgeText: HARDCODED_PLEDGE,
      quitClause: sanitizeMultilineText(quitClause),
      signature: finalSignature,
      committedAt: new Date().toISOString(),
    };

    await saveProfile(profile);

    // Request notification permission gracefully
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('Notification permission request error:', err);
      }
    }

    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] dark:bg-black text-[#1b1b1c] dark:text-white pb-24">
      {/* Stepper Progress Header */}
      <div className="max-w-md mx-auto px-6 pt-6 pb-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>
            {step === 1 && 'Step 1 of 3'}
            {step === 2 && 'Step 2 of 3'}
            {step === 3 && 'Step 3 of 3'}
          </span>
          <span className="text-accent">
            {step === 1 && 'Personal Identity'}
            {step === 2 && 'The Covenant'}
            {step === 3 && 'Covenant Sealed'}
          </span>
        </div>

        {/* Stepper progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-400 ease-out rounded-full"
            style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-4">
        {/* STEP 1: Personal Identity */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold tracking-widest text-accent uppercase">
                PLEDGE COVENANT
              </span>
              <h2 className="text-3xl font-extrabold hero-text mt-1">
                Who Are You?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Before the words are etched, define the author of this vow.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-black p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/15 space-y-6">
              {/* Selfie Avatar Preview & Explicit Dual Actions */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-accent-subtle flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-black/60 shadow-sm">
                    {selfie ? (
                      <img src={selfie} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  {selfie && (
                    <button
                      type="button"
                      onClick={() => setSelfie('')}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-700 transition"
                      title="Remove picture"
                      aria-label="Remove picture"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Two Distinct Explicit Buttons */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={startSelfieCamera}
                    className="py-2.5 px-3 rounded-2xl bg-accent hover-bg-accent text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                  >
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                    <span>Take a selfie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-2xl bg-accent-container text-accent border border-accent-subtle text-xs font-bold flex items-center justify-center gap-2 shadow-2xs hover:opacity-90 transition active:scale-95"
                  >
                    <Upload className="w-4 h-4 stroke-[2.2]" />
                    <span>Upload profile picture</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelfieChange}
                />
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#1b1b1c] dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 ring-accent"
                  />
                </div>
              </div>

              {/* DOB Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#1b1b1c] dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 ring-accent"
                  />
                  <Calendar className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Identity Expression Segmented Control */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Identity Expression
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 rounded-full text-xs font-medium capitalize transition-all ${
                        gender === g
                          ? 'bg-accent text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => {
                if (!name.trim()) {
                  alert('Please enter your name.');
                  return;
                }
                setStep(2);
              }}
              className="w-full py-4 rounded-full bg-accent hover-bg-accent text-white font-semibold text-base shadow-lg shadow-accent/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: The Covenant Pledge */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold tracking-widest text-accent uppercase">
                SACRED CONTRACT
              </span>
              <h2 className="text-3xl font-extrabold hero-text mt-1">
                The Sacred Vow
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Listen, sign, and anchor your commitment into memory.
              </p>
            </div>

            {/* Pledge Card */}
            <div className="bg-white dark:bg-black p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/15 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Written Covenant
                </span>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    isSpeaking
                      ? 'bg-amber-100 text-amber-900 animate-pulse'
                      : 'bg-accent-container text-accent hover:opacity-90 font-bold'
                  }`}
                  aria-label="Listen to pledge"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen to Vow</span>
                    </>
                  )}
                </button>
              </div>

              <blockquote className="text-sm italic leading-relaxed text-slate-700 dark:text-slate-300 font-serif border-l-2 border-accent pl-3 py-1 bg-accent-container rounded-r-xl">
                "{HARDCODED_PLEDGE}"
              </blockquote>

              {/* "If I fail, I will quit" clause */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>If I fail my covenant, I will quit:</span>
                  <span className="text-[10px] text-slate-400">Required clause</span>
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={quitClause}
                  onChange={(e) => setQuitClause(e.target.value)}
                  placeholder="e.g., mindless scrolling, negative self-talk, postponing my morning routine..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 ring-accent"
                />
              </div>

              {/* Signature Pad */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sacred Digital Signature
                  </label>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {isReadOnly && existingProfile?.signature ? (
                  <div className="h-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2 flex items-center justify-center">
                    <img
                      src={existingProfile.signature}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative">
                    <canvas ref={canvasRef} className="w-full h-28 touch-none cursor-crosshair" />
                    <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 pointer-events-none">
                      Sign with finger or stylus
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-black/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSealCovenant}
                  className="flex-1 py-4 rounded-full bg-accent hover-bg-accent text-white font-semibold text-base shadow-lg shadow-accent/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Seal Covenant</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onComplete(existingProfile!)}
                className="w-full py-4 rounded-full bg-accent hover-bg-accent text-white font-semibold text-base shadow-lg shadow-accent/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
              >
                <span>Return to Journal</span>
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Covenant Sealed Ceremony */}
        {step === 3 && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-500 pt-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/25 relative">
              <Sparkles className="w-12 h-12 text-amber-300 animate-spin-slow" />
              <CheckCircle2 className="w-7 h-7 text-emerald-400 absolute -bottom-1 -right-1 bg-white rounded-full" />
            </div>

            <div>
              <span className="text-xs font-bold tracking-widest text-accent uppercase">
                COVENANT ETERNAL
              </span>
              <h2 className="text-3xl font-extrabold hero-text mt-1">
                Your Vow is Sealed
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                Welcome, <strong>{name}</strong>. Your commitment is etched in device storage. Reality is now conforming to your written intention.
              </p>
            </div>

            <div className="bg-white dark:bg-black p-5 rounded-3xl shadow-sm border border-black/5 dark:border-white/15 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Committed At:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Binding Quit Clause:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[200px]">
                  {quitClause}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const completeProfile: Profile = {
                  id: 'user-profile',
                  name: name.trim() || 'Manifestor',
                  dob,
                  gender,
                  selfie,
                  pledgeText: HARDCODED_PLEDGE,
                  quitClause,
                  signature: signatureData,
                  committedAt: new Date().toISOString(),
                };
                onComplete(completeProfile);
              }}
              className="w-full py-4 rounded-full bg-accent hover-bg-accent text-white font-semibold text-base shadow-lg shadow-accent/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              <span>Enter Your Sacred Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Live Selfie Camera Viewfinder Modal */}
      {isSelfieCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-black border border-white/20 p-5 shadow-2xl flex flex-col items-center space-y-4 text-white">
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold flex items-center gap-1.5 text-accent">
                <Camera className="w-4 h-4 text-accent" />
                <span>Take Your Covenant Selfie</span>
              </span>
              <button
                type="button"
                onClick={stopSelfieCamera}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Viewfinder */}
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-accent shadow-2xl bg-black">
              <video
                ref={selfieVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-full pointer-events-none" />
            </div>

            <p className="text-[11px] text-slate-300 text-center max-w-xs">
              Align your face within the sacred circle and tap capture.
            </p>

            <div className="w-full flex gap-3 pt-2">
              <button
                type="button"
                onClick={stopSelfieCamera}
                className="flex-1 py-3 rounded-full border border-white/20 text-xs font-semibold hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureSelfiePhoto}
                className="flex-1 py-3 rounded-full bg-accent hover-bg-accent text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
