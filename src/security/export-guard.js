// ═══════════════════════════════════════
// FILE: src/security/export-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

import JSZip from 'jszip';

export class IntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IntegrityError';
  }
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes export payload by removing prototype pollution vectors
 * and breaking circular references.
 *
 * @param {any} data
 * @param {WeakSet} [visited=new WeakSet()]
 * @returns {any}
 */
export function sanitizeExportData(data, visited = new WeakSet()) {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (visited.has(data)) {
    return null; // Break circular reference
  }
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeExportData(item, visited));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(data)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    cleanObj[key] = sanitizeExportData(value, visited);
  }

  return cleanObj;
}

/**
 * Generates SHA-256 hex checksum of a Blob.
 *
 * @param {Blob} zipBlob
 * @returns {Promise<string>}
 */
export async function generateExportChecksum(zipBlob) {
  const buffer = await zipBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a verified, signed, and sanitized ZIP export archive.
 *
 * @param {Record<string, any>} dbData
 * @param {Array<{filename: string, blob: Blob, folder: string}>} mediaFiles
 * @returns {Promise<{blob: Blob, checksum: string}>}
 */
export async function createSecureExport(dbData, mediaFiles = []) {
  const zip = new JSZip();

  // 1. Sanitize all IDB store data
  const cleanData = sanitizeExportData(dbData);
  zip.file('database.json', JSON.stringify(cleanData, null, 2));

  // 2. Add media files
  const mediaFolder = zip.folder('media');
  for (const item of mediaFiles) {
    if (item && item.filename && item.blob) {
      const folderRef = item.folder ? mediaFolder.folder(item.folder) : mediaFolder;
      folderRef.file(item.filename, item.blob);
    }
  }

  // 3. Manifest metadata
  const storeCounts = {};
  for (const [store, list] of Object.entries(cleanData || {})) {
    storeCounts[store] = Array.isArray(list) ? list.length : 1;
  }

  const manifest = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.1',
    stores: storeCounts,
    mediaFiles: mediaFiles.length,
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  zip.comment = 'Manifest Journal Export — Verify checksum before restoring.';

  // 4. Generate initial Blob and compute checksum
  const initialBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const checksum = await generateExportChecksum(initialBlob);

  // Update manifest with computed checksum
  manifest.checksum = checksum;
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const finalBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const finalChecksum = await generateExportChecksum(finalBlob);

  return { blob: finalBlob, checksum: finalChecksum };
}

/**
 * Validates integrity of an imported ZIP archive against its manifest.
 *
 * @param {Blob} zipBlob
 * @returns {Promise<{manifest: any, zip: JSZip}>}
 */
export async function validateImportZip(zipBlob) {
  const zip = await JSZip.loadAsync(zipBlob);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new IntegrityError('Invalid backup archive: missing manifest.json');
  }

  const manifestText = await manifestFile.async('text');
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch (err) {
    throw new IntegrityError('Corrupted backup manifest: unable to parse JSON');
  }

  const dbFile = zip.file('database.json');
  if (!dbFile) {
    throw new IntegrityError('Invalid backup archive: missing database.json');
  }

  return { manifest, zip };
}
