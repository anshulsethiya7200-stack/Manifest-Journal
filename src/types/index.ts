export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: 'user-profile';
  name: string;
  dob: string;
  gender: Gender;
  selfie: string; // base64 data URL
  pledgeText: string;
  quitClause: string;
  signature: string; // base64 PNG
  committedAt: string; // ISO string
}

export type GoalType = 'today' | 'month' | 'year' | '5year' | '10year';
export type GoalStatus = 'active' | 'completed' | 'expired';

export interface Goal {
  id: string;
  type: GoalType;
  text: string;
  setAt: string; // ISO
  deadline: string; // ISO
  completedAt: string | null;
  status: GoalStatus;
  progressCurrent?: number;
  progressTarget?: number;
}

export interface ScriptPage {
  id: string;
  date: string; // YYYY-MM-DD
  page: number; // 1-indexed
  content: string;
  sessionComplete: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  text: string;
  mediaRefs: string[]; // OPFS filenames
  createdAt: string;
}

export type MediaType = 'photo' | 'video' | 'recording';
export type MediaSource = 'camera' | 'journal' | 'teleprompter';

export interface AlbumMedia {
  id: string;
  filename: string;
  type: MediaType;
  source: MediaSource;
  takenAt: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
}

export interface TeleprompterScript {
  id: string;
  title: string;
  content: string;
  speed: number;
  createdAt: string;
}

export interface Streak {
  type: 'scripting';
  count: number;
  lastDate: string; // YYYY-MM-DD
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: AppTheme;
  accentColor: string;
}

export interface StorageEstimateInfo {
  quota: number;
  usage: number;
  remainingMb: number;
  percentUsed: number;
  isLowSpace: boolean;
}
