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

export function getDB() {
  if (!dbPromise) {
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
  }
  return dbPromise;
}

// ── Profile ──
export async function getProfile(): Promise<Profile | undefined> {
  const db = await getDB();
  return db.get('profile', 'user-profile');
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB();
  await db.put('profile', profile);
}

// ── Goals ──
export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

export async function getGoalByType(type: Goal['type']): Promise<Goal | undefined> {
  const goals = await getAllGoals();
  return goals.find((g) => g.type === type && g.status === 'active');
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDB();
  await db.put('goals', goal);
}

export async function initializeDefaultGoalsIfEmpty(): Promise<void> {
  // No sample goals inserted; user defines their own authentic goals.
}

export async function purgeSampleData(): Promise<void> {
  const db = await getDB();
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
}

// ── Scripting Pages ──
export async function getScriptPagesByDate(dateStr: string): Promise<ScriptPage[]> {
  const db = await getDB();
  const tx = db.transaction('script-pages', 'readonly');
  const index = tx.store.index('by-date');
  const pages = await index.getAll(dateStr);
  return pages.sort((a, b) => a.page - b.page);
}

export async function saveScriptPage(page: ScriptPage): Promise<void> {
  const db = await getDB();
  await db.put('script-pages', page);
}

export async function getAllScriptPages(): Promise<ScriptPage[]> {
  const db = await getDB();
  return db.getAll('script-pages');
}

// ── Streaks ──
export async function getStreak(type: 'scripting' = 'scripting'): Promise<Streak> {
  const db = await getDB();
  const record = await db.get('streaks', type);
  return record || { type, count: 0, lastDate: '' };
}

export async function updateScriptingStreak(todayStr: string): Promise<number> {
  const db = await getDB();
  const current = await getStreak('scripting');
  
  if (current.lastDate === todayStr) {
    // Already marked today
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
    // Missed a day -> reset to 1
    newCount = 1;
  }

  const updated: Streak = {
    type: 'scripting',
    count: newCount,
    lastDate: todayStr,
  };
  await db.put('streaks', updated);
  return newCount;
}

// ── Journal Entries ──
export async function getJournalEntriesByDate(dateStr: string): Promise<JournalEntry[]> {
  const db = await getDB();
  const tx = db.transaction('journal-entries', 'readonly');
  const index = tx.store.index('by-date');
  const entries = await index.getAll(dateStr);
  return entries.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  return db.getAll('journal-entries');
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  await db.put('journal-entries', entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('journal-entries', id);
}

// ── Album Media Metadata ──
export async function getAllAlbumMedia(): Promise<AlbumMedia[]> {
  const db = await getDB();
  const media = await db.getAll('album');
  return media.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
}

export async function saveAlbumMedia(media: AlbumMedia): Promise<void> {
  const db = await getDB();
  await db.put('album', media);
}

export async function deleteAlbumMedia(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('album', id);
}

// ── Teleprompter Scripts ──
export async function getAllTeleprompterScripts(): Promise<TeleprompterScript[]> {
  const db = await getDB();
  return db.getAll('teleprompter-scripts');
}

export async function saveTeleprompterScript(script: TeleprompterScript): Promise<void> {
  const db = await getDB();
  await db.put('teleprompter-scripts', script);
}

export async function deleteTeleprompterScript(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('teleprompter-scripts', id);
}

// ── Settings ──
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const item = await db.get('settings', key);
  return item ? (item.value as T) : defaultValue;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAppSettings(): Promise<AppSettings> {
  const theme = await getSetting<AppSettings['theme']>('theme', 'system');
  const accentColor = await getSetting<string>('accentColor', '#0b57d0');
  return { theme, accentColor };
}

// ── Storage Quota ──
export async function checkStorageQuota(): Promise<StorageEstimateInfo> {
  if (navigator.storage && navigator.storage.estimate) {
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
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await indexedDB.deleteDatabase(DB_NAME);
}
