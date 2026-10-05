// ═══════════════════════════════════════
// FILE: src/security/media-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

export const activeCameraStreams = new Set();

/**
 * Requests camera access based on role mode with constraint fallbacks.
 *
 * @param {'photo'|'video'|'selfie'} mode
 * @returns {Promise<MediaStream|null>}
 */
export async function requestCameraAccess(mode) {
  let constraints;

  if (mode === 'selfie') {
    constraints = {
      video: { facingMode: 'user', width: { max: 1280 }, height: { max: 720 } },
      audio: false,
    };
  } else if (mode === 'photo') {
    constraints = {
      video: { facingMode: 'environment', width: { max: 1920 }, height: { max: 1080 } },
      audio: false,
    };
  } else if (mode === 'video') {
    constraints = {
      video: { facingMode: 'environment', width: { max: 1920 }, height: { max: 1080 } },
      audio: true,
    };
  } else {
    constraints = { video: true, audio: false };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    activeCameraStreams.add(stream);
    return stream;
  } catch (err) {
    if (err.name === 'OverconstrainedError') {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: mode === 'video',
        });
        activeCameraStreams.add(fallbackStream);
        return fallbackStream;
      } catch (fallbackErr) {
        console.error('[Media Guard] Fallback camera request failed:', fallbackErr);
        return null;
      }
    } else if (err.name === 'NotAllowedError') {
      console.warn('[Media Guard] Camera permission denied by user or policy.');
      if (typeof alert === 'function') {
        alert('Camera permission denied. Enable it in browser settings.');
      }
    } else if (err.name === 'NotFoundError') {
      console.warn('[Media Guard] No camera found on this device.');
      if (typeof alert === 'function') {
        alert('No camera found on this device.');
      }
    } else {
      console.error('[Media Guard] Camera error:', err);
    }
    return null;
  }
}

/**
 * Stops all tracks in a MediaStream and removes from tracking.
 *
 * @param {MediaStream|null} stream
 */
export function stopMediaStream(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.warn('[Media Guard] Error stopping track:', err);
  }
  activeCameraStreams.delete(stream);
}

/**
 * Stops all currently active media streams across the application.
 */
export function stopAllActiveStreams() {
  for (const stream of activeCameraStreams) {
    stopMediaStream(stream);
  }
  activeCameraStreams.clear();
}

/**
 * Captures an image snapshot from a video element and cleans canvas memory.
 *
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<Blob>}
 */
export function capturePhotoFromStream(videoElement) {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      return reject(new Error('Video element not provided'));
    }

    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Could not get 2d context for canvas'));
    }

    ctx.drawImage(videoElement, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        // Immediately wipe canvas memory
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        canvas.width = 1;
        canvas.height = 1;

        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob generated null'));
        }
      },
      'image/jpeg',
      0.85
    );
  });
}

/**
 * Probes browser for supported video MIME types in prioritized order.
 *
 * @returns {string}
 */
export function getSupportedVideoMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
  }

  return 'video/webm';
}

/**
 * Creates a MediaRecorder instance with lifecycle error safeguards.
 *
 * @param {MediaStream} stream
 * @param {(data: Blob) => void} onDataAvailable
 * @param {() => void} onStop
 * @returns {MediaRecorder}
 */
export function createSecureMediaRecorder(stream, onDataAvailable, onStop) {
  const mimeType = getSupportedVideoMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0 && onDataAvailable) {
      onDataAvailable(event.data);
    }
  };

  recorder.onstop = () => {
    if (onStop) onStop();
  };

  recorder.onerror = (err) => {
    console.error('[Media Guard] Recorder error:', err);
    stopMediaStream(stream);
  };

  return recorder;
}

// Lifecycle listeners: stop camera when tab hides or unloads
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopAllActiveStreams();
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    stopAllActiveStreams();
  });
  window.addEventListener('beforeunload', () => {
    stopAllActiveStreams();
  });
}
