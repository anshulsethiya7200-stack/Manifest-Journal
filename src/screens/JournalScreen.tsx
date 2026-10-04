import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, AlbumMedia } from '../types';
import {
  getJournalEntriesByDate,
  getAllJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  saveAlbumMedia,
} from '../lib/storage';
import { saveMediaFile, getMediaBlobUrl } from '../lib/opfs';
import {
  Plus,
  Clock,
  MoreVertical,
  Camera,
  Video,
  Image as ImageIcon,
  X,
  Calendar,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface JournalScreenProps {
  initialState?: { openNew?: boolean; prefill?: string };
  onRefreshData?: () => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({
  initialState,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [todayEntries, setTodayEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  // New Moment Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(initialState?.openNew || false);
  const [momentTime, setMomentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 5); // "HH:MM"
  });
  const [momentText, setMomentText] = useState(initialState?.prefill || '');
  const [attachedRefs, setAttachedRefs] = useState<string[]>([]);

  // Camera / Media capture modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayDateStr = new Date().toISOString().split('T')[0];

  const loadEntries = async () => {
    const todayList = await getJournalEntriesByDate(todayDateStr);
    const allList = await getAllJournalEntries();
    setTodayEntries(todayList);
    setAllEntries(allList);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Resolve media URLs
  useEffect(() => {
    const refsToLoad: string[] = [];
    todayEntries.forEach((e) => refsToLoad.push(...e.mediaRefs));
    allEntries.forEach((e) => refsToLoad.push(...e.mediaRefs));

    refsToLoad.forEach(async (ref) => {
      if (!mediaUrls[ref]) {
        const url = await getMediaBlobUrl(ref);
        if (url) {
          setMediaUrls((prev) => ({ ...prev, [ref]: url }));
        }
      }
    });
  }, [todayEntries, allEntries]);

  // Open live camera stream
  const startCamera = async (mode: 'photo' | 'video') => {
    setCameraMode(mode);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
        audio: mode === 'video',
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      alert('Camera access could not be initialized. Please check device permissions.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsRecording(false);
  };

  // Capture Photo from stream
  const capturePhoto = async () => {
    if (!videoPreviewRef.current) return;
    const video = videoPreviewRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const ref = await saveMediaFile(blob, 'journal-attachments', 'jpg');
      const albumItem: AlbumMedia = {
        id: crypto.randomUUID(),
        filename: ref,
        type: 'photo',
        source: 'journal',
        takenAt: new Date().toISOString(),
      };
      await saveAlbumMedia(albumItem);

      setAttachedRefs((prev) => [...prev, ref]);
      const url = URL.createObjectURL(blob);
      setMediaUrls((prev) => ({ ...prev, [ref]: url }));
      stopCamera();
    }, 'image/jpeg');
  };

  // Start Video Recording
  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const ref = await saveMediaFile(blob, 'journal-attachments', 'webm');
      const albumItem: AlbumMedia = {
        id: crypto.randomUUID(),
        filename: ref,
        type: 'video',
        source: 'journal',
        takenAt: new Date().toISOString(),
      };
      await saveAlbumMedia(albumItem);

      setAttachedRefs((prev) => [...prev, ref]);
      const url = URL.createObjectURL(blob);
      setMediaUrls((prev) => ({ ...prev, [ref]: url }));
      stopCamera();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.includes('video');
    const ref = await saveMediaFile(file, 'journal-attachments');
    const albumItem: AlbumMedia = {
      id: crypto.randomUUID(),
      filename: ref,
      type: isVid ? 'video' : 'photo',
      source: 'journal',
      takenAt: new Date().toISOString(),
    };
    await saveAlbumMedia(albumItem);

    setAttachedRefs((prev) => [...prev, ref]);
    const url = URL.createObjectURL(file);
    setMediaUrls((prev) => ({ ...prev, [ref]: url }));
  };

  // Save new Journal Entry
  const handleSaveMoment = async () => {
    if (!momentText.trim()) {
      alert('Please enter your journal reflection.');
      return;
    }

    // Format time display: "08:30 AM"
    const [hoursStr, minsStr] = momentTime.split(':');
    let h = parseInt(hoursStr, 10);
    const m = minsStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formattedDisplayTime = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: todayDateStr,
      time: formattedDisplayTime,
      text: momentText.trim(),
      mediaRefs: attachedRefs,
      createdAt: new Date().toISOString(),
    };

    await saveJournalEntry(newEntry);
    setIsSheetOpen(false);
    setMomentText('');
    setAttachedRefs([]);
    await loadEntries();
    onRefreshData?.();
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Delete this anchored journal entry?')) {
      await deleteJournalEntry(id);
      await loadEntries();
      onRefreshData?.();
    }
  };

  const formattedHeaderDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Tab Switcher: Today vs History */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
            activeTab === 'today'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
            activeTab === 'history'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          History
        </button>
      </div>

      {/* TODAY TAB */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="text-center py-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold hero-text">
              {formattedHeaderDate}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              {todayEntries.length} Anchored Moments Recorded
            </p>
          </div>

          {/* List of Anchored Moment Cards */}
          <div className="space-y-4">
            {todayEntries.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-black rounded-3xl border border-dashed border-slate-200 dark:border-white/15 p-6 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent-container flex items-center justify-center text-accent">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">
                  No anchored moments yet today
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Capture intentional thoughts, gratitude, synchronicities, or photos as they unfold.
                </p>
                <button
                  onClick={() => setIsSheetOpen(true)}
                  className="px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-semibold shadow-xs transition active:scale-95"
                >
                  Record First Moment
                </button>
              </div>
            ) : (
              todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-black p-5 rounded-3xl border border-black/5 dark:border-white/15 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-container text-accent text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{entry.time}</span>
                    </span>

                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 transition"
                      title="Delete entry"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {entry.text}
                  </p>

                  {/* Media Attachments */}
                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {entry.mediaRefs.map((ref, idx) => {
                      const url = mediaUrls[ref];
                      const isVid = ref.includes('webm') || ref.includes('mp4');
                      return (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative group/media"
                        >
                          {url ? (
                            isVid ? (
                              <video src={url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={url} alt={`Journal attachment ${idx + 1}`} className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                              Media
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add media directly to this entry */}
                    <button
                      onClick={() => {
                        setIsSheetOpen(true);
                        setMomentText(entry.text);
                      }}
                      className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent transition active:scale-95"
                      title="Edit or add media"
                      aria-label="Edit or add media to moment"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-center py-2">
            <h2 className="text-2xl font-extrabold hero-text">
              Chronological Archive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your manifestation journey through time
            </p>
          </div>

          <div className="space-y-3">
            {allEntries.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-black rounded-3xl border border-dashed border-slate-200 dark:border-white/15 p-6 space-y-2">
                <p className="text-xs text-slate-400">No historical moments recorded yet.</p>
              </div>
            ) : (
              allEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-black p-4 rounded-2xl border border-black/5 dark:border-white/15 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-accent">
                      {entry.date} · {entry.time}
                    </span>
                    <span>{entry.mediaRefs.length} attachments</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                    {entry.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for new moment */}
      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-accent hover-bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/25 active:scale-95 transition"
        aria-label="Add anchored moment"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Add Moment Sheet / Modal */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-black border border-black/5 dark:border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base hero-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Anchor a New Moment</span>
              </h3>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Picker */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <span>Moment Time:</span>
              </label>
              <input
                type="time"
                value={momentTime}
                onChange={(e) => setMomentTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

            {/* Textarea */}
            <textarea
              rows={4}
              value={momentText}
              onChange={(e) => setMomentText(e.target.value)}
              placeholder="What intention, sync, or gratitude was experienced in this moment?"
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 ring-accent"
            />

            {/* Attached Thumbnails */}
            {attachedRefs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedRefs.map((ref, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border">
                    <img
                      src={mediaUrls[ref]}
                      alt="attachment"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setAttachedRefs((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Media attachment buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => startCamera('photo')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-accent-subtle border border-transparent transition"
              >
                <Camera className="w-4 h-4 text-accent" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => startCamera('video')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-accent-subtle border border-transparent transition"
              >
                <Video className="w-4 h-4 text-accent" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-accent-subtle border border-transparent transition"
              >
                <ImageIcon className="w-4 h-4 text-accent" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Save Moment */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSheetOpen(false)}
                className="px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMoment}
                className="px-6 py-2.5 rounded-full bg-accent hover-bg-accent text-white text-xs font-bold shadow transition active:scale-95"
              >
                Anchor Moment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white p-4">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full uppercase">
              {cameraMode === 'photo' ? 'Photo Snapshot' : 'Video Recording'}
            </span>
            <button onClick={stopCamera} className="p-2 rounded-full bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl bg-black">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>

          <div className="flex justify-center items-center pb-6">
            {cameraMode === 'photo' ? (
              <button
                onClick={capturePhoto}
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>
            ) : isRecording ? (
              <button
                onClick={stopVideoRecording}
                className="w-18 h-18 rounded-full border-4 border-rose-500 flex items-center justify-center active:scale-90 transition animate-pulse"
              >
                <div className="w-7 h-7 rounded-sm bg-rose-500" />
              </button>
            ) : (
              <button
                onClick={startVideoRecording}
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
