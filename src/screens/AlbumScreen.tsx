import React, { useState, useEffect, useRef } from 'react';
import { AlbumMedia } from '../types';
import { getAllAlbumMedia, saveAlbumMedia, deleteAlbumMedia } from '../lib/storage';
import { saveMediaFile, getMediaBlobUrl, getMediaBlob, deleteMediaFile } from '../lib/opfs';
import {
  Camera,
  Video,
  Download,
  Trash2,
  X,
  Play,
  Share2,
  Tv,
} from 'lucide-react';

interface AlbumScreenProps {
  initialOpenCamera?: boolean;
  onRefreshData?: () => void;
}

export const AlbumScreen: React.FC<AlbumScreenProps> = ({
  initialOpenCamera = false,
  onRefreshData,
}) => {
  const [mediaList, setMediaList] = useState<AlbumMedia[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'recording'>('all');

  // Full-screen viewer
  const [activeMedia, setActiveMedia] = useState<AlbumMedia | null>(null);

  // In-app Camera
  const [isCameraOpen, setIsCameraOpen] = useState(initialOpenCamera);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const streamInstanceRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const loadMedia = async () => {
    const list = await getAllAlbumMedia();
    setMediaList(list);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Resolve blob URLs for items
  useEffect(() => {
    mediaList.forEach(async (item) => {
      if (!blobUrls[item.filename]) {
        const url = await getMediaBlobUrl(item.filename);
        if (url) {
          setBlobUrls((prev) => ({ ...prev, [item.filename]: url }));
        }
      }
    });
  }, [mediaList]);

  // Open camera stream
  const openCameraStream = async (mode: 'photo' | 'video') => {
    setCameraMode(mode);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: mode === 'video',
      });
      streamInstanceRef.current = stream;
      if (videoStreamRef.current) {
        videoStreamRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera error:', err);
      alert('Unable to access camera. Please verify device permissions.');
      setIsCameraOpen(false);
    }
  };

  const closeCameraStream = () => {
    if (streamInstanceRef.current) {
      streamInstanceRef.current.getTracks().forEach((t) => t.stop());
      streamInstanceRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCameraOpen(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const capturePhoto = async () => {
    if (!videoStreamRef.current) return;
    const video = videoStreamRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const filename = await saveMediaFile(blob, 'album', 'jpg');
      const item: AlbumMedia = {
        id: crypto.randomUUID(),
        filename,
        type: 'photo',
        source: 'camera',
        takenAt: new Date().toISOString(),
        width: canvas.width,
        height: canvas.height,
      };
      await saveAlbumMedia(item);
      const url = URL.createObjectURL(blob);
      setBlobUrls((prev) => ({ ...prev, [filename]: url }));
      await loadMedia();
      closeCameraStream();
      onRefreshData?.();
    }, 'image/jpeg');
  };

  const startVideoRecording = () => {
    if (!streamInstanceRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(streamInstanceRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const filename = await saveMediaFile(blob, 'album', 'webm');
      const item: AlbumMedia = {
        id: crypto.randomUUID(),
        filename,
        type: 'video',
        source: 'camera',
        takenAt: new Date().toISOString(),
      };
      await saveAlbumMedia(item);
      const url = URL.createObjectURL(blob);
      setBlobUrls((prev) => ({ ...prev, [filename]: url }));
      await loadMedia();
      closeCameraStream();
      onRefreshData?.();
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDownload = async (item: AlbumMedia) => {
    const blob = await getMediaBlob(item.filename);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${item.type}-${item.takenAt.slice(0, 10)}.${item.filename.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDelete = async (item: AlbumMedia) => {
    if (confirm('Delete this media item from your private album?')) {
      await deleteMediaFile(item.filename);
      await deleteAlbumMedia(item.id);
      setActiveMedia(null);
      await loadMedia();
      onRefreshData?.();
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    if (filter === 'all') return true;
    return m.type === filter;
  });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Header with Camera Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold hero-text">
            Private Album
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted in sandboxed OPFS. Isolated from phone gallery.
          </p>
        </div>

        <button
          onClick={() => openCameraStream('photo')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-semibold shadow-md active:scale-95 transition"
        >
          <Camera className="w-4 h-4" />
          <span>Open Camera</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-black rounded-full border border-slate-200 dark:border-white/15">
        {(['all', 'photo', 'video', 'recording'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              filter === cat
                ? 'bg-accent text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {cat === 'all' ? 'All Media' : cat + 's'}
          </button>
        ))}
      </div>

      {/* 3-Column Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-black rounded-3xl border border-dashed border-slate-200 dark:border-white/15 p-6 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-accent-container flex items-center justify-center text-accent">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#1b1b1c] dark:text-white">No media captured yet</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
            Take manifestation photos, video affirmations, or teleprompter recordings.
          </p>
          <button
            onClick={() => openCameraStream('photo')}
            className="px-4 py-2 rounded-full bg-accent hover-bg-accent text-white text-xs font-semibold shadow-xs active:scale-95 transition"
          >
            Take First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredMedia.map((item) => {
            const url = blobUrls[item.filename];
            const isVid = item.type === 'video' || item.type === 'recording';
            return (
              <div
                key={item.id}
                onClick={() => setActiveMedia(item)}
                className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative cursor-pointer group shadow-2xs border border-black/5 dark:border-white/5"
              >
                {url ? (
                  isVid ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={url}
                      alt={`Captured ${item.type} ${new Date(item.takenAt).toLocaleDateString()}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Loading
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                  {item.source === 'teleprompter' ? (
                    <Tv className="w-3 h-3 text-amber-300" />
                  ) : isVid ? (
                    <Play className="w-3 h-3" />
                  ) : null}
                  <span className="capitalize">{item.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-screen Media Viewer Dialog */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white p-4 animate-in fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase">
                {activeMedia.source} · {activeMedia.type}
              </p>
              <p className="text-[11px] text-slate-400">
                {new Date(activeMedia.takenAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setActiveMedia(null)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30"
              aria-label="Close media viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Center */}
          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
            {activeMedia.type === 'video' || activeMedia.type === 'recording' ? (
              <video
                src={blobUrls[activeMedia.filename]}
                controls
                autoPlay
                playsInline
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <img
                src={blobUrls[activeMedia.filename]}
                alt="Enlarged"
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
          </div>

          {/* Bottom Actions: Download to phone gallery, Share, Delete */}
          <div className="flex items-center justify-around pb-6 max-w-xs mx-auto w-full">
            <button
              onClick={() => handleDownload(activeMedia)}
              className="flex flex-col items-center gap-1 text-xs text-slate-200 hover:text-white"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <span>Download</span>
            </button>

            {navigator.share && (
              <button
                onClick={async () => {
                  const blob = await getMediaBlob(activeMedia.filename);
                  if (blob && navigator.share) {
                    try {
                      const file = new File([blob], activeMedia.filename, { type: blob.type });
                      await navigator.share({
                        files: [file],
                        title: 'Manifest Journal Media',
                      });
                    } catch (e) {
                      console.warn('Share error:', e);
                    }
                  }
                }}
                className="flex flex-col items-center gap-1 text-xs text-slate-200 hover:text-white"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <span>Share</span>
              </button>
            )}

            <button
              onClick={() => handleDelete(activeMedia)}
              className="flex flex-col items-center gap-1 text-xs text-rose-300 hover:text-rose-100"
            >
              <div className="w-10 h-10 rounded-full bg-rose-900/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-300" />
              </div>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* In-App Camera Viewport */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white p-4">
          <div className="flex justify-between items-center z-10">
            <div className="flex gap-2">
              <button
                onClick={() => openCameraStream('photo')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cameraMode === 'photo' ? 'bg-white text-black' : 'bg-white/20 text-white'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => openCameraStream('video')}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cameraMode === 'video' ? 'bg-white text-black' : 'bg-white/20 text-white'
                }`}
              >
                Video
              </button>
            </div>
            <button onClick={closeCameraStream} className="p-2 rounded-full bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl bg-black">
            <video
              ref={videoStreamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-3xl"
            />
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-mono font-bold animate-pulse">
                REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </div>
            )}
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
