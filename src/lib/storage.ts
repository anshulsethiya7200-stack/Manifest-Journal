import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Profile,
  Goal,
  ScriptPage,
  JournalEntry,
  TeleprompterScript,
  AlbumMedia,
  Streak,
  AppSettings,
  StorageEstimateInfo,
} from '../types';
import {
  sanitizeProfile,
  sanitizeGoal,
  sanitizeScriptPage,
  sanitizeJournalEntry,
  sanitizeTeleprompterScript,
  sanitizeText,
} from './sanitize';

interface ManifestJournalDB extends DBSchema {
  profile: {
    key: string;
    value: Profile;
  };
  goals: {
    key: string;
    value: Goal;
  };
  'script-pages': {
    key: string;
    value: ScriptPage;
    indexes: { 'by-date': string };
  };
  'journal-entries': {
    key: string;
    value: JournalEntry;
    indexes: { 'by-date': string };
  };
  'teleprompter-scripts': {
    key: string;
    value: TeleprompterScript;
  };
  album: {
    key: string;
    value: AlbumMedia;
    indexes: { 'by-taken-at': string };
  };
  settings: {
    key: string;
    value: { key: string; value: any };
  };
  streaks: {
    key: string;
    value: Streak;
  };
  'fallback-blobs': {
    key: string;
    value: { name: string; blob: Blob };
  };
}

const DB_NAME = 'manifest-journal-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ManifestJournalDB>> | null = null;

// In-memory volatile fallback if IndexedDB is blocked by browser SecurityError / Private mode
const volatileMemoryStore: Record<string, Map<string, any>> = {
  profile: new Map(),
  goals: new Map(),
  'script-pages': new Map(),
  'journal-entries': new Map(),
  'teleprompter-scripts': new Map(),
  album: new Map(),
  settings: new Map(),
  streaks: new Map(),
  'fallback-blobs': new Map(),
};

export async function getDB(): Promise<IDBPDatabase<ManifestJournalDB> | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  if (!dbPromise) {
    try {
      dbPromise = openDB<ManifestJournalDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('goals')) {
            db.createObjectStore('goals', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('script-pages')) {
            const scriptStore = db.createObjectStore('script-pages', { keyPath: 'id' });
            scriptStore.createIndex('by-date', 'date');
          }
          if (!db.objectStoreNames.contains('journal-entries')) {
            const journalStore = db.createObjectStore('journal-entries', { keyPath: 'id' });
            journalStore.createIndex('by-date', 'date');
          }
          if (!db.objectStoreNames.contains('teleprompter-scripts')) {
            db.createObjectStore('teleprompter-scripts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('album')) {
            const albumStore = db.createObjectStore('album', { keyPath: 'id' });
            albumStore.createIndex('by-taken-at', 'takenAt');
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('streaks')) {
            db.createObjectStore('streaks', { keyPath: 'type' });
          }
          if (!db.objectStoreNames.contains('fallback-blobs')) {
            db.createObjectStore('fallback-blobs', { keyPath: 'name' });
          }
        },
      });
    } catch (err) {
      console.warn('IndexedDB initialization failed, falling back to volatile storage:', err);
      dbPromise = null;
      return null;
    }
  }

  try {
    return await dbPromise;
  } catch (err) {
    console.warn('Error connecting to IndexedDB:', err);
    return null;
  }
}

// ── Profile ──
export async function getProfile(): Promise<Profile | undefined> {
  try {
    const db = await getDB();
    if (db) {
      const raw = await db.get('profile', 'user-profile');
      const clean = sanitizeProfile(raw);
      return clean || undefined;
    }
    const mem = volatileMemoryStore.profile.get('user-profile');
    return sanitizeProfile(mem) || undefined;
  } catch (err) {
    console.error('getProfile recovery error:', err);
    return undefined;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const clean = sanitizeProfile(profile);
  if (!clean) return;

  try {
    const db = await getDB();
    if (db) {
      await db.put('profile', clean);
      return;
    }
  } catch (err) {
    console.warn('saveProfile IDB write failed, using memory store:', err);
  }
  volatileMemoryStore.profile.set('user-profile', clean);
}

// ── Goals ──
export async function getAllGoals(): Promise<Goal[]> {
  try {
    const db = await getDB();
    if (db) {
      const rawList = await db.getAll('goals');
      return rawList
        .map((g) => sanitizeGoal(g))
        .filter((g): g is Goal => g !== null);
    }
    return Array.from(volatileMemoryStore.goals.values())
      .map((g) => sanitizeGoal(g))
      .filter((g): g is Goal => g !== null);
  } catch (err) {
    console.error('getAllGoals recovery error:', err);
    return [];
  }
}

export async function getGoalByType(type: Goal['type']): Promise<Goal | undefined> {
  const goals = await getAllGoals();
  return goals.find((g) => g.type === type && g.status === 'active');
}

export async function saveGoal(goal: Goal): Promise<void> {
  const clean = sanitizeGoal(goal);
  if (!clean) return;

  try {
    const db = await getDB();
    if (db) {
      await db.put('goals', clean);
      return;
    }
  } catch (err) {
    console.warn('saveGoal IDB write failed, using memory store:', err);
  }
  volatileMemoryStore.goals.set(clean.id, clean);
}

export async function initializeDefaultGoalsIfEmpty(): Promise<void> {
  // Pure clean canvas; user creates their own intentional goals.
}

export async function purgeSampleData(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;

    const sampleGoalTexts = [
      'Write 3 affirmations and script future abundance before evening reflection.',
      'Complete 24 consecutive scripting sessions and anchor clear financial milestones.',
      'Launch independent creative studio, scale revenue, and maintain unshakeable inner peace.',
      'Full location independence, international sanctuary home, and mentoring others.',
      'Enduring legacy of conscious innovation, generational freedom, and creative mastery.',
    ];
    const allGoals = await db.getAll('goals');
    for (const g of allGoals) {
      if (sampleGoalTexts.includes(g.text)) {
        await db.delete('goals', g.id);
      }
    }

    const sampleJournalTexts = [
      'Quiet morning ritual with matcha tea. Focused on deep gratitude for clarity and creative momentum in the studio today. The sun aligns directly across the work desk.',
      'Breakthrough realization regarding the architecture review. Everything falls into place when removing redundant friction. Re-centering intentions before the afternoon sprint.',
      'Evening garden walk. The crisp air helps anchor today’s progress. Grateful for quiet consistency over chaotic rushes. Tomorrow is prepared with calm purpose.',
    ];
    const allJournal = await db.getAll('journal-entries');
    for (const j of allJournal) {
      if (sampleJournalTexts.some((txt) => j.text.includes(txt.slice(0, 30)))) {
        await db.delete('journal-entries', j.id);
      }
    }

    const sampleScriptPrefix = 'I am naturally aligning with boundless clarity';
    const allScripts = await db.getAll('script-pages');
    for (const s of allScripts) {
      if (s.content.includes(sampleScriptPrefix)) {
        await db.delete('script-pages', s.id);
      }
    }

    const prof = await db.get('profile', 'user-profile');
    if (prof && prof.name === 'Elena Vance') {
      await db.delete('profile', 'user-profile');
    }

    const currentStreak = await db.get('streaks', 'scripting');
    if (currentStreak && currentStreak.count === 3 && !currentStreak.lastDate) {
      await db.put('streaks', { type: 'scripting', count: 0, lastDate: '' });
    }
  } catch (err) {
    console.warn('purgeSampleData error:', err);
  }
}

// ── Scripting Pages ──
export async function getScriptPagesByDate(dateStr: string): Promise<ScriptPage[]> {
  const cleanDate = sanitizeText(dateStr);
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction('script-pages', 'readonly');
      const index = tx.store.index('by-date');
      const pages = await index.getAll(cleanDate);
      return pages
        .map((p) => sanitizeScriptPage(p))
        .filter((p): p is ScriptPage => p !== null)
        .sort((a, b) => a.page - b.page);
    }
    return Array.from(volatileMemoryStore['script-pages'].values())
      .filter((p) => p.date === cleanDate)
      .map((p) => sanitizeScriptPage(p))
      .filter((p): p is ScriptPage => p !== null)
      .sort((a, b) => a.page - b.page);
  } catch (err) {
    console.error('getScriptPagesByDate error:', err);
    return [];
  }
}

export async function saveScriptPage(page: ScriptPage): Promise<void> {
  const clean = sanitizeScriptPage(page);
  if (!clean) return;

  try {
    const db = await getDB();
    if (db) {
      await db.put('script-pages', clean);
      return;
    }
  } catch (err) {
    console.warn('saveScriptPage IDB write failed, using memory store:', err);
  }
  volatileMemoryStore['script-pages'].set(clean.id, clean);
}

export async function getAllScriptPages(): Promise<ScriptPage[]> {
  try {
    const db = await getDB();
    if (db) {
      const pages = await db.getAll('script-pages');
      return pages
        .map((p) => sanitizeScriptPage(p))
        .filter((p): p is ScriptPage => p !== null);
    }
    return Array.from(volatileMemoryStore['script-pages'].values())
      .map((p) => sanitizeScriptPage(p))
      .filter((p): p is ScriptPage => p !== null);
  } catch (err) {
    console.error('getAllScriptPages error:', err);
    return [];
  }
}

// ── Streaks ──
export async function getStreak(type: 'scripting' = 'scripting'): Promise<Streak> {
  try {
    const db = await getDB();
    if (db) {
      const record = await db.get('streaks', type);
      return record || { type, count: 0, lastDate: '' };
    }
    return volatileMemoryStore.streaks.get(type) || { type, count: 0, lastDate: '' };
  } catch (err) {
    console.warn('getStreak error:', err);
    return { type, count: 0, lastDate: '' };
  }
}

export async function updateScriptingStreak(todayStr: string): Promise<number> {
  const current = await getStreak('scripting');
  
  if (current.lastDate === todayStr) {
    return current.count;
  }

  const today = new Date(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newCount = 1;
  if (current.lastDate === yesterdayStr) {
    newCount = current.count + 1;
  } else if (!current.lastDate) {
    newCount = 1;
  } else {
    newCount = 1;
  }

  const updated: Streak = {
    type: 'scripting',
    count: newCount,
    lastDate: todayStr,
  };

  try {
    const db = await getDB();
    if (db) {
      await db.put('streaks', updated);
      return newCount;
    }
  } catch (err) {
    console.warn('updateScriptingStreak IDB write error:', err);
  }
  volatileMemoryStore.streaks.set('scripting', updated);
  return newCount;
}

// ── Journal Entries ──
export async function getJournalEntriesByDate(dateStr: string): Promise<JournalEntry[]> {
  const cleanDate = sanitizeText(dateStr);
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction('journal-entries', 'readonly');
      const index = tx.store.index('by-date');
      const entries = await index.getAll(cleanDate);
      return entries
        .map((e) => sanitizeJournalEntry(e))
        .filter((e): e is JournalEntry => e !== null)
        .sort((a, b) => a.time.localeCompare(b.time));
    }
    return Array.from(volatileMemoryStore['journal-entries'].values())
      .filter((e) => e.date === cleanDate)
      .map((e) => sanitizeJournalEntry(e))
      .filter((e): e is JournalEntry => e !== null)
      .sort((a, b) => a.time.localeCompare(b.time));
  } catch (err) {
    console.error('getJournalEntriesByDate error:', err);
    return [];
  }
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  try {
    const db = await getDB();
    if (db) {
      const entries = await db.getAll('journal-entries');
      return entries
        .map((e) => sanitizeJournalEntry(e))
        .filter((e): e is JournalEntry => e !== null);
    }
    return Array.from(volatileMemoryStore['journal-entries'].values())
      .map((e) => sanitizeJournalEntry(e))
      .filter((e): e is JournalEntry => e !== null);
  } catch (err) {
    console.error('getAllJournalEntries error:', err);
    return [];
  }
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const clean = sanitizeJournalEntry(entry);
  if (!clean) return;

  try {
    const db = await getDB();
    if (db) {
      await db.put('journal-entries', clean);
      return;
    }
  } catch (err) {
    console.warn('saveJournalEntry IDB write failed:', err);
  }
  volatileMemoryStore['journal-entries'].set(clean.id, clean);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const cleanId = sanitizeText(id);
  try {
    const db = await getDB();
    if (db) {
      await db.delete('journal-entries', cleanId);
    }
  } catch (err) {
    console.warn('deleteJournalEntry error:', err);
  }
  volatileMemoryStore['journal-entries'].delete(cleanId);
}

// ── Album Media Metadata ──
export async function getAllAlbumMedia(): Promise<AlbumMedia[]> {
  try {
    const db = await getDB();
    if (db) {
      const media = await db.getAll('album');
      return media.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    }
    return Array.from(volatileMemoryStore.album.values()).sort(
      (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );
  } catch (err) {
    console.error('getAllAlbumMedia error:', err);
    return [];
  }
}

export async function saveAlbumMedia(media: AlbumMedia): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await db.put('album', media);
      return;
    }
  } catch (err) {
    console.warn('saveAlbumMedia IDB write failed:', err);
  }
  volatileMemoryStore.album.set(media.id, media);
}

export async function deleteAlbumMedia(id: string): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await db.delete('album', id);
    }
  } catch (err) {
    console.warn('deleteAlbumMedia error:', err);
  }
  volatileMemoryStore.album.delete(id);
}

// ── Teleprompter Scripts ──
export async function getAllTeleprompterScripts(): Promise<TeleprompterScript[]> {
  try {
    const db = await getDB();
    if (db) {
      const scripts = await db.getAll('teleprompter-scripts');
      return scripts
        .map((s) => sanitizeTeleprompterScript(s))
        .filter((s): s is TeleprompterScript => s !== null);
    }
    return Array.from(volatileMemoryStore['teleprompter-scripts'].values())
      .map((s) => sanitizeTeleprompterScript(s))
      .filter((s): s is TeleprompterScript => s !== null);
  } catch (err) {
    console.error('getAllTeleprompterScripts error:', err);
    return [];
  }
}

export async function saveTeleprompterScript(script: TeleprompterScript): Promise<void> {
  const clean = sanitizeTeleprompterScript(script);
  if (!clean) return;

  try {
    const db = await getDB();
    if (db) {
      await db.put('teleprompter-scripts', clean);
      return;
    }
  } catch (err) {
    console.warn('saveTeleprompterScript IDB write failed:', err);
  }
  volatileMemoryStore['teleprompter-scripts'].set(clean.id, clean);
}

export async function deleteTeleprompterScript(id: string): Promise<void> {
  const cleanId = sanitizeText(id);
  try {
    const db = await getDB();
    if (db) {
      await db.delete('teleprompter-scripts', cleanId);
    }
  } catch (err) {
    console.warn('deleteTeleprompterScript error:', err);
  }
  volatileMemoryStore['teleprompter-scripts'].delete(cleanId);
}

// ── Settings ──
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    if (db) {
      const item = await db.get('settings', key);
      return item ? (item.value as T) : defaultValue;
    }
    const mem = volatileMemoryStore.settings.get(key);
    return mem !== undefined ? mem : defaultValue;
  } catch (err) {
    console.warn(`getSetting ${key} error:`, err);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await db.put('settings', { key, value });
      return;
    }
  } catch (err) {
    console.warn(`setSetting ${key} write failed:`, err);
  }
  volatileMemoryStore.settings.set(key, value);
}

export async function getAppSettings(): Promise<AppSettings> {
  const theme = await getSetting<AppSettings['theme']>('theme', 'dark');
  let accentColor = await getSetting<string>('accentColor', '#0b57d0');
  if (accentColor && accentColor.toLowerCase() === '#ea580c') {
    accentColor = '#c2410c';
    await setSetting('accentColor', '#c2410c');
  }
  return { theme, accentColor };
}

// ── Storage Quota ──
export async function checkStorageQuota(): Promise<StorageEstimateInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const remainingBytes = Math.max(0, quota - usage);
      const remainingMb = Math.round(remainingBytes / (1024 * 1024));
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return {
        quota,
        usage,
        remainingMb,
        percentUsed,
        isLowSpace: remainingMb < 500,
      };
    } catch (err) {
      console.warn('Storage estimate failed:', err);
    }
  }
  return {
    quota: 10 * 1024 * 1024 * 1024,
    usage: 0,
    remainingMb: 10000,
    percentUsed: 0,
    isLowSpace: false,
  };
}

// ── Clear All Data ──
export async function clearAllDatabase(): Promise<void> {
  try {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }
    if (typeof indexedDB !== 'undefined') {
      await indexedDB.deleteDatabase(DB_NAME);
    }
  } catch (err) {
    console.warn('clearAllDatabase error:', err);
  }
  // Clear volatile memory store
  Object.values(volatileMemoryStore).forEach((m) => m.clear());
}
