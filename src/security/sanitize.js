// ═══════════════════════════════════════
// FILE: src/security/sanitize.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

/**
 * Sanitizes generic user text input.
 * Strips HTML tags using DOMParser text extraction (never regex).
 * Strips null bytes (\u0000).
 * Enforces maxLength (throws RangeError if exceeded; does not silently truncate).
 *
 * @param {string} input
 * @param {number} [maxLength=10000]
 * @returns {string}
 */
export function sanitizeText(input, maxLength = 10000) {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  const trimmed = input.trim();

  // Strip null bytes
  const nullStripped = trimmed.replace(/\u0000/g, '');

  if (maxLength && nullStripped.length > maxLength) {
    throw new RangeError(
      `Maximum length of ${maxLength} exceeded (received ${nullStripped.length} characters)`
    );
  }

  // Parse using DOMParser and extract pure textContent
  const parser = new DOMParser();
  const doc = parser.parseFromString(nullStripped, 'text/html');
  const clean = doc.body.textContent || '';

  return clean;
}

/**
 * Sanitizes a filename for OPFS operations.
 * Removes path separators and illegal file characters (/ \ : * ? " < > |).
 * Strips leading dots.
 * Enforces max length of 200 characters.
 *
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFileName(name) {
  if (typeof name !== 'string') {
    throw new TypeError('Filename must be a string');
  }

  // Remove illegal characters / \ : * ? " < > | and control chars
  let clean = name.replace(/[/\\:*?"<>|\x00-\x1F]/g, '');

  // Strip leading dots to prevent hidden/parent-dir traversal files
  clean = clean.replace(/^\.+/, '');

  // Limit to 200 characters
  clean = clean.slice(0, 200).trim();

  if (!clean) {
    clean = `file_${Date.now()}`;
  }

  return clean;
}

/**
 * Sanitizes and validates a URL.
 * Only allows http: and https: protocols.
 * Throws SecurityError for javascript:, data:, blob:, file:, vbscript:.
 *
 * @param {string} url
 * @returns {string}
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    throw new TypeError('URL must be a string');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new URIError(`Invalid URL string: ${url}`);
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'https:' && protocol !== 'http:') {
    const error = new Error(`Blocked unsafe URL protocol: ${protocol}`);
    error.name = 'SecurityError';
    throw error;
  }

  return parsed.href;
}

/**
 * Validates and sanitizes image data URLs (e.g. captured selfies, signatures).
 *
 * @param {string} dataUrl
 * @param {string[]} [allowedTypes=['image/jpeg', 'image/png', 'image/webp']]
 * @returns {string}
 */
export function sanitizeImageDataUrl(
  dataUrl,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
) {
  if (typeof dataUrl !== 'string') {
    throw new TypeError('Data URL must be a string');
  }

  if (!dataUrl.startsWith('data:')) {
    const error = new Error('Invalid image: does not start with data: prefix');
    error.name = 'SecurityError';
    throw error;
  }

  const matches = dataUrl.match(/^data:([^;]+);base64,/);
  if (!matches || !matches[1]) {
    const error = new Error('Invalid or non-base64 data URL format');
    error.name = 'SecurityError';
    throw error;
  }

  const mimeType = matches[1].toLowerCase();
  if (!allowedTypes.includes(mimeType)) {
    const error = new Error(
      `Disallowed image MIME type: ${mimeType}. Allowed: ${allowedTypes.join(', ')}`
    );
    error.name = 'SecurityError';
    throw error;
  }

  // Enforce max size of 5MB: base64 length * 0.75 gives approximate raw bytes
  const base64Data = dataUrl.slice(matches[0].length);
  const approximateBytes = base64Data.length * 0.75;
  if (approximateBytes > 5_000_000) {
    const error = new Error(
      `Image data exceeds maximum allowed size of 5MB (approx. ${(approximateBytes / 1024 / 1024).toFixed(2)} MB)`
    );
    error.name = 'SecurityError';
    throw error;
  }

  return dataUrl;
}

/**
 * Validates and parses an integer within bounds.
 *
 * @param {number|string} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function sanitizeInteger(value, min, max) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Value is not a valid integer: ${value}`);
  }
  if (parsed < min || parsed > max) {
    throw new RangeError(`Integer ${parsed} is outside allowed range [${min}, ${max}]`);
  }
  return parsed;
}

/**
 * Validates ISO date string format (YYYY-MM-DD).
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeDate(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Date must be a string');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`Date must match YYYY-MM-DD format (received: ${value})`);
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new TypeError(`Date string represents an invalid calendar date: ${value}`);
  }
  return value;
}
