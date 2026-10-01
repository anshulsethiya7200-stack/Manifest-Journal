import React, { useState, useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { Profile, Gender } from '../types';
import { saveProfile } from '../lib/storage';
import {
  Camera,
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

  // Signature Pad ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadInstance = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      name: name.trim() || 'Manifestor',
      dob,
      gender,
      selfie,
      pledgeText: HARDCODED_PLEDGE,
      quitClause: quitClause.trim(),
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
    <div className="min-h-screen bg-[#fcf9f8] dark:bg-[#111318] text-[#1b1b1c] dark:text-[#e2e2e9] pb-24">
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
            <div className="bg-white dark:bg-[#1d2024] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 space-y-6">
              {/* Selfie Avatar Circle */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-accent-subtle flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800/40">
                    {selfie ? (
                      <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover-bg-accent active:scale-95 transition"
                    aria-label="Upload or take selfie photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleSelfieChange}
                  />
                </div>
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
            <div className="bg-white dark:bg-[#1d2024] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 space-y-4">
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

            <div className="bg-white dark:bg-[#1d2024] p-5 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 text-left text-xs space-y-2">
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
    </div>
  );
};
