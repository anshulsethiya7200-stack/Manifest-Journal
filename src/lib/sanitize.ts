// src/lib/sanitize.ts — Client-side XSS Protection & Schema Sanitization
import DOMPurify from 'dompurify';
import { Profile, Gender, Goal, ScriptPage, JournalEntry, TeleprompterScript } from '../types';

/**
 * Sanitize plain text inputs: strips all HTML tags and script execution vectors.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Clean through DOMPurify with no allowed tags to strip any injected HTML/scripts
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return cleaned.trim();
}

/**
 * Sanitize multiline text (notebook script, journal reflections, teleprompter scripts)
 * preserving safe line breaks while stripping dangerous HTML/tags.
 */
export function sanitizeMultilineText(input: unknown): string {
  if (typeof input !== 'string') return '';
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return cleaned;
}

/**
 * Schema validation and sanitization for Profile record
 */
export function sanitizeProfile(profile: unknown): Profile | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Partial<Profile>;

  const id: 'user-profile' = 'user-profile';
  const name = sanitizeText(p.name) || 'Soul Manifestor';
  const dob = sanitizeText(p.dob);
  const validGenders: Gender[] = ['male', 'female', 'other'];
  const gender: Gender = validGenders.includes(p.gender as Gender) ? (p.gender as Gender) : 'other';
  // Ensure selfie is a valid data URL or safe URL
  let selfie = typeof p.selfie === 'string' ? p.selfie : '';
  if (selfie && !selfie.startsWith('data:image/') && !selfie.startsWith('blob:') && !selfie.startsWith('/')) {
    selfie = '';
  }
  const pledgeText = sanitizeMultilineText(p.pledgeText);
  const quitClause = sanitizeMultilineText(p.quitClause);
  const signature = typeof p.signature === 'string' && p.signature.startsWith('data:image/') ? p.signature : '';
  const committedAt = sanitizeText(p.committedAt) || new Date().toISOString();

  return {
    id,
    name,
    dob,
    gender,
    selfie,
    pledgeText,
    quitClause,
    signature,
    committedAt,
  };
}

/**
 * Schema validation and sanitization for Goal record
 */
export function sanitizeGoal(goal: unknown): Goal | null {
  if (!goal || typeof goal !== 'object') return null;
  const g = goal as Partial<Goal>;

  const validTypes = ['today', 'month', 'year', '5year', '10year'] as const;
  const type = validTypes.includes(g.type as any) ? (g.type as Goal['type']) : 'today';
  const status = ['active', 'completed', 'expired'].includes(g.status as any) ? g.status! : 'active';

  return {
    id: sanitizeText(g.id) || crypto.randomUUID(),
    type,
    text: sanitizeText(g.text),
    setAt: sanitizeText(g.setAt) || new Date().toISOString(),
    deadline: sanitizeText(g.deadline) || new Date().toISOString(),
    completedAt: g.completedAt ? sanitizeText(g.completedAt) : null,
    status,
    progressCurrent: typeof g.progressCurrent === 'number' ? Math.max(0, g.progressCurrent) : undefined,
    progressTarget: typeof g.progressTarget === 'number' ? Math.max(1, g.progressTarget) : undefined,
  };
}

/**
 * Schema validation and sanitization for ScriptPage record
 */
export function sanitizeScriptPage(page: unknown): ScriptPage | null {
  if (!page || typeof page !== 'object') return null;
  const s = page as Partial<ScriptPage>;

  return {
    id: sanitizeText(s.id) || crypto.randomUUID(),
    date: sanitizeText(s.date) || new Date().toISOString().split('T')[0],
    page: typeof s.page === 'number' && s.page > 0 ? s.page : 1,
    content: sanitizeMultilineText(s.content),
    sessionComplete: Boolean(s.sessionComplete),
    createdAt: sanitizeText(s.createdAt) || new Date().toISOString(),
  };
}

/**
 * Schema validation and sanitization for JournalEntry record
 */
export function sanitizeJournalEntry(entry: unknown): JournalEntry | null {
  if (!entry || typeof entry !== 'object') return null;
  const j = entry as Partial<JournalEntry>;

  const mediaRefs = Array.isArray(j.mediaRefs)
    ? j.mediaRefs
        .filter((r): r is string => typeof r === 'string')
        .map((r) => sanitizeText(r))
        .filter(Boolean)
    : [];

  return {
    id: sanitizeText(j.id) || crypto.randomUUID(),
    date: sanitizeText(j.date) || new Date().toISOString().split('T')[0],
    time: sanitizeText(j.time) || '12:00',
    text: sanitizeMultilineText(j.text),
    mediaRefs,
    createdAt: sanitizeText(j.createdAt) || new Date().toISOString(),
  };
}

/**
 * Schema validation and sanitization for TeleprompterScript record
 */
export function sanitizeTeleprompterScript(script: unknown): TeleprompterScript | null {
  if (!script || typeof script !== 'object') return null;
  const t = script as Partial<TeleprompterScript>;

  const speed = typeof t.speed === 'number' && !isNaN(t.speed) ? Math.min(3.0, Math.max(0.5, t.speed)) : 1.0;

  return {
    id: sanitizeText(t.id) || crypto.randomUUID(),
    title: sanitizeText(t.title) || 'Spoken Affirmation',
    content: sanitizeMultilineText(t.content),
    speed,
    createdAt: sanitizeText(t.createdAt) || new Date().toISOString(),
  };
}
