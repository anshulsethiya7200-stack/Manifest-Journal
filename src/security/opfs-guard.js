// ═══════════════════════════════════════
// FILE: src/security/opfs-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

import { sanitizeFileName } from './sanitize.js';

export const ALLOWED_MEDIA_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/webm', 'video/mp4', 'video/ogg'],
};

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 500 * 1024 * 1024, // 500 MB
};

/**
 * Validates file MIME type, size limit, and image magic bytes.
 *
 * @param {Blob} blob
 * @param {'image'|'video'} expectedType
 * @returns {Promise<boolean>}
 */
export async function validateFileBeforeWrite(blob, expectedType) {
  if (!blob || !(blob instanceof Blob)) {
    throw new TypeError('File must be a valid Blob or File instance');
  }

  const allowedTypes = ALLOWED_MEDIA_TYPES[expectedType];
  if (!allowedTypes || !allowedTypes.includes(blob.type)) {
    const error = new Error(
      `Disallowed file MIME type: ${blob.type}. Expected one of: ${allowedTypes ? allowedTypes.join(', ') : 'none'}`
    );
    error.name = 'SecurityError';
    throw error;
  }

  const maxSize = MAX_FILE_SIZES[expectedType];
  if (blob.size > maxSize) {
    const error = new Error(
      `File size ${(blob.size / 1024 / 1024).toFixed(2)} MB exceeds maximum limit of ${(maxSize / 1024 / 1024).toFixed(0)} MB`
    );
    error.name = 'SecurityError';
    throw error;
  }

  // Magic byte verification for image types
  if (expectedType === 'image') {
    const buffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let isValid = false;

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      isValid = blob.type === 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    else if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      isValid = blob.type === 'image/png';
    }
    // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
    else if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      isValid = blob.type === 'image/webp';
    }

    if (!isValid) {
      const error = new Error(
        `Magic bytes signature does not match claimed MIME type ${blob.type}`
      );
      error.name = 'SecurityError';
      throw error;
    }
  }

  return true;
}

/**
 * Safely writes a file to OPFS directory.
 *
 * @param {FileSystemDirectoryHandle} rootDir
 * @param {string} subDir
 * @param {string} filename
 * @param {Blob} blob
 * @param {'image'|'video'} expectedType
 * @returns {Promise<string>}
 */
export async function safeWriteToOPFS(rootDir, subDir, filename, blob, expectedType) {
  await validateFileBeforeWrite(blob, expectedType);

  const cleanFilename = sanitizeFileName(filename);
  const cleanSubDir = sanitizeFileName(subDir);

  const dirHandle = await rootDir.getDirectoryHandle(cleanSubDir, { create: true });
  const fileHandle = await dirHandle.getFileHandle(cleanFilename, { create: true });

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  return cleanFilename;
}

/**
 * Safely reads a file from OPFS directory without throwing on missing file.
 *
 * @param {FileSystemDirectoryHandle} rootDir
 * @param {string} subDir
 * @param {string} filename
 * @returns {Promise<File|null>}
 */
export async function safeReadFromOPFS(rootDir, subDir, filename) {
  try {
    const cleanFilename = sanitizeFileName(filename);
    const cleanSubDir = sanitizeFileName(subDir);

    const dirHandle = await rootDir.getDirectoryHandle(cleanSubDir);
    const fileHandle = await dirHandle.getFileHandle(cleanFilename);
    const file = await fileHandle.getFile();
    return file;
  } catch (err) {
    return null;
  }
}

/**
 * Safely deletes a file from OPFS directory.
 *
 * @param {FileSystemDirectoryHandle} rootDir
 * @param {string} subDir
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export async function safeDeleteFromOPFS(rootDir, subDir, filename) {
  try {
    const cleanFilename = sanitizeFileName(filename);
    const cleanSubDir = sanitizeFileName(subDir);

    const dirHandle = await rootDir.getDirectoryHandle(cleanSubDir);
    await dirHandle.removeEntry(cleanFilename);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Checks storage quota estimate and returns warning level.
 *
 * @returns {Promise<{used: number, quota: number, percentUsed: number, warningLevel: 'ok'|'warn'|'critical'}>}
 */
export async function getOPFSQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 1;
    const percentUsed = (used / quota) * 100;

    let warningLevel = 'ok';
    if (percentUsed >= 90) {
      warningLevel = 'critical';
    } else if (percentUsed >= 70) {
      warningLevel = 'warn';
    }

    return { used, quota, percentUsed, warningLevel };
  }

  return { used: 0, quota: 0, percentUsed: 0, warningLevel: 'ok' };
}
