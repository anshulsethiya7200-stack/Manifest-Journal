// ═══════════════════════════════════════
// FILE: src/security/db-guard.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

import {
  sanitizeText,
  sanitizeDate,
  sanitizeInteger,
  sanitizeImageDataUrl,
  sanitizeFileName,
} from './sanitize.js';

export class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates a Goal record before writing to IDB.
 */
export function validateGoal(record) {
  if (!record || typeof record !== 'object') {
    throw new ValidationError('record', 'Goal record must be an object');
  }

  if (typeof record.id !== 'string' || !record.id.trim()) {
    throw new ValidationError('id', 'Goal id must be a non-empty string');
  }

  const allowedTypes = ['today', 'month', 'year', '5year', '10year'];
  if (!allowedTypes.includes(record.type)) {
    throw new ValidationError('type', `Type must be one of: ${allowedTypes.join(', ')}`);
  }

  try {
    record.text = sanitizeText(record.text || '', 500);
  } catch (err) {
    throw new ValidationError('text', err.message);
  }

  if (record.setAt && Number.isNaN(Date.parse(record.setAt))) {
    throw new ValidationError('setAt', 'setAt must be a valid ISO datetime string');
  }

  if (record.deadline && Number.isNaN(Date.parse(record.deadline))) {
    throw new ValidationError('deadline', 'deadline must be a valid ISO datetime string');
  }

  const allowedStatuses = ['active', 'completed', 'expired'];
  if (!allowedStatuses.includes(record.status)) {
    throw new ValidationError('status', `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  return true;
}

/**
 * Validates a Journal Entry record before writing to IDB.
 */
export function validateJournalEntry(record) {
  if (!record || typeof record !== 'object') {
    throw new ValidationError('record', 'Journal entry record must be an object');
  }

  if (typeof record.id !== 'string' || !record.id.trim()) {
    throw new ValidationError('id', 'Journal id must be a non-empty string');
  }

  try {
    sanitizeDate(record.date);
  } catch (err) {
    throw new ValidationError('date', err.message);
  }

  if (typeof record.time !== 'string' || !/^\d{2}:\d{2}$/.test(record.time)) {
    throw new ValidationError('time', 'time must match HH:MM (24-hour) format');
  }

  try {
    record.text = sanitizeText(record.text || '', 10000);
  } catch (err) {
    throw new ValidationError('text', err.message);
  }

  if (!Array.isArray(record.mediaRefs)) {
    record.mediaRefs = [];
  } else {
    for (let i = 0; i < record.mediaRefs.length; i++) {
      try {
        record.mediaRefs[i] = sanitizeFileName(record.mediaRefs[i]);
      } catch (err) {
        throw new ValidationError(`mediaRefs[${i}]`, err.message);
      }
    }
  }

  return true;
}

/**
 * Validates a Script Page record before writing to IDB.
 */
export function validateScriptPage(record) {
  if (!record || typeof record !== 'object') {
    throw new ValidationError('record', 'Script page record must be an object');
  }

  if (typeof record.id !== 'string' || !record.id.trim()) {
    throw new ValidationError('id', 'Script page id must be a non-empty string');
  }

  try {
    sanitizeDate(record.date);
  } catch (err) {
    throw new ValidationError('date', err.message);
  }

  try {
    record.page = sanitizeInteger(record.page, 1, 999);
  } catch (err) {
    throw new ValidationError('page', err.message);
  }

  try {
    record.content = sanitizeText(record.content || '', 10000);
  } catch (err) {
    throw new ValidationError('content', err.message);
  }

  if (typeof record.sessionComplete !== 'boolean') {
    throw new ValidationError('sessionComplete', 'sessionComplete must be a boolean');
  }

  return true;
}

/**
 * Validates a User Profile record before writing to IDB.
 */
export function validateProfile(record) {
  if (!record || typeof record !== 'object') {
    throw new ValidationError('record', 'Profile record must be an object');
  }

  try {
    record.name = sanitizeText(record.name || '', 100);
  } catch (err) {
    throw new ValidationError('name', err.message);
  }

  if (record.dob) {
    try {
      sanitizeDate(record.dob);
    } catch (err) {
      throw new ValidationError('dob', err.message);
    }
  }

  const allowedGenders = ['male', 'female', 'other', ''];
  if (record.gender && !allowedGenders.includes(record.gender)) {
    throw new ValidationError('gender', `Gender must be one of: male, female, other`);
  }

  if (record.selfie) {
    try {
      sanitizeImageDataUrl(record.selfie);
    } catch (err) {
      throw new ValidationError('selfie', err.message);
    }
  }

  try {
    record.pledgeText = sanitizeText(record.pledgeText || '', 10000);
  } catch (err) {
    throw new ValidationError('pledgeText', err.message);
  }

  try {
    record.quitClause = sanitizeText(record.quitClause || '', 300);
  } catch (err) {
    throw new ValidationError('quitClause', err.message);
  }

  if (record.signature) {
    if (
      typeof record.signature !== 'string' ||
      !record.signature.startsWith('data:image/png;base64,')
    ) {
      throw new ValidationError(
        'signature',
        'Signature must be a base64 PNG data URL (data:image/png;base64,...)'
      );
    }
    // Check under 2MB
    if (record.signature.length * 0.75 > 2_000_000) {
      throw new ValidationError('signature', 'Signature image data exceeds maximum 2MB size');
    }
  }

  if (record.committedAt && Number.isNaN(Date.parse(record.committedAt))) {
    throw new ValidationError('committedAt', 'committedAt must be a valid ISO datetime string');
  }

  return true;
}

/**
 * Validates Album Media metadata before writing to IDB.
 */
export function validateAlbumMedia(record) {
  if (!record || typeof record !== 'object') {
    throw new ValidationError('record', 'Album media record must be an object');
  }

  if (typeof record.id !== 'string' || !record.id.trim()) {
    throw new ValidationError('id', 'Media id must be a non-empty string');
  }

  try {
    record.filename = sanitizeFileName(record.filename);
  } catch (err) {
    throw new ValidationError('filename', err.message);
  }

  const allowedTypes = ['photo', 'video', 'recording'];
  if (!allowedTypes.includes(record.type)) {
    throw new ValidationError('type', `Type must be one of: ${allowedTypes.join(', ')}`);
  }

  const allowedSources = ['camera', 'journal', 'teleprompter'];
  if (!allowedSources.includes(record.source)) {
    throw new ValidationError('source', `Source must be one of: ${allowedSources.join(', ')}`);
  }

  if (record.takenAt && Number.isNaN(Date.parse(record.takenAt))) {
    throw new ValidationError('takenAt', 'takenAt must be a valid ISO datetime string');
  }

  return true;
}

/**
 * Runs an integrity audit on boot across all stores in IDB.
 * Records failing validation are quarantined into a 'quarantine' store.
 *
 * @param {IDBDatabase} db
 */
export async function runIntegrityCheck(db) {
  if (!db) return { checked: 0, quarantined: 0 };

  const storeValidators = {
    goals: validateGoal,
    'journal-entries': validateJournalEntry,
    'script-pages': validateScriptPage,
    profile: validateProfile,
    album: validateAlbumMedia,
  };

  let totalChecked = 0;
  let totalQuarantined = 0;

  for (const [storeName, validator] of Object.entries(storeValidators)) {
    if (!db.objectStoreNames.contains(storeName)) continue;

    try {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      const items = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      for (const item of items) {
        totalChecked++;
        try {
          validator(item);
        } catch (validationErr) {
          console.warn(`[Integrity Check] Record failed in store ${storeName}:`, validationErr.message);

          // Quarantine corrupted item if quarantine store exists
          if (db.objectStoreNames.contains('quarantine')) {
            try {
              const qTx = db.transaction([storeName, 'quarantine'], 'readwrite');
              const qStore = qTx.objectStore('quarantine');
              const sourceStore = qTx.objectStore(storeName);

              const key = item.id || item.key || Date.now();
              await new Promise((res, rej) => {
                const addReq = qStore.put({
                  originalStore: storeName,
                  originalKey: key,
                  quarantinedAt: new Date().toISOString(),
                  error: validationErr.message,
                  data: item,
                });
                addReq.onsuccess = res;
                addReq.onerror = rej;
              });

              await new Promise((res, rej) => {
                const delReq = sourceStore.delete(key);
                delReq.onsuccess = res;
                delReq.onerror = rej;
              });

              totalQuarantined++;
            } catch (qErr) {
              console.error('[Integrity Check] Failed to quarantine record:', qErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Integrity Check] Could not verify store ${storeName}:`, err);
    }
  }

  console.info(`[Integrity Check] Audit complete:`, {
    checked: totalChecked,
    quarantined: totalQuarantined,
  });

  if (totalQuarantined > 0 && typeof document !== 'undefined') {
    const banner = document.createElement('div');
    banner.className =
      'fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-md';
    banner.textContent =
      'Some data was quarantined due to integrity issues. Export your data and contact support.';
    document.body.prepend(banner);
  }

  return { checked: totalChecked, quarantined: totalQuarantined };
}
