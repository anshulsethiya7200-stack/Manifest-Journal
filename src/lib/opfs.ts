import JSZip from 'jszip';
import { getDB, getAllGoals, getAllJournalEntries, getAllScriptPages, getProfile, getAppSettings } from './storage';

export type OPFSSubdir = 'album' | 'journal-attachments' | 'teleprompter-recordings';

const ROOT_DIR_NAME = 'manifest-media';

// Check if OPFS is supported and accessible in current browsing context
export function isOPFSSupported(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.storage &&
      typeof navigator.storage.getDirectory === 'function'
    );
  } catch {
    return false;
  }
}

// Get root handle with robust error boundary for SecurityError in iframes
async function getMediaDirHandle(subdir?: OPFSSubdir): Promise<FileSystemDirectoryHandle | null> {
  if (!isOPFSSupported()) return null;
  try {
    const root = await navigator.storage.getDirectory();
    const mediaDir = await root.getDirectoryHandle(ROOT_DIR_NAME, { create: true });
    if (subdir) {
      return await mediaDir.getDirectoryHandle(subdir, { create: true });
    }
    return mediaDir;
  } catch (err) {
    // SecurityError often thrown in restricted sandboxed iframes or private modes
    console.warn('OPFS handle access restricted, falling back to IDB storage:', err);
    return null;
  }
}

// Save binary file to OPFS (or fallback to IDB fallback-blobs)
export async function saveMediaFile(
  blob: Blob,
  subdir: OPFSSubdir,
  customExt?: string
): Promise<string> {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  let ext = customExt;
  if (!ext) {
    if (blob.type.includes('png')) ext = 'png';
    else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg';
    else if (blob.type.includes('mp4')) ext = 'mp4';
    else if (blob.type.includes('webm')) ext = 'webm';
    else ext = 'bin';
  }
  const filename = `${timestamp}-${uuid}.${ext}`;
  const ref = `${subdir}/${filename}`;

  try {
    const dir = await getMediaDirHandle(subdir);
    if (dir) {
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return ref;
    }
  } catch (err) {
    console.warn('Failed writing to OPFS, routing to fallback store:', err);
  }

  // Fallback to IndexedDB
  try {
    const db = await getDB();
    if (db) {
      await db.put('fallback-blobs', { name: ref, blob });
    }
  } catch (idbErr) {
    console.warn('Failed writing fallback blob to IDB:', idbErr);
  }
  return ref;
}

// Read binary file from OPFS (or fallback to IDB) and return ObjectURL
export async function getMediaBlobUrl(mediaRef: string): Promise<string | null> {
  const parts = mediaRef.split('/');
  const subdir = (parts.length > 1 ? parts[0] : 'album') as OPFSSubdir;
  const filename = parts.length > 1 ? parts[1] : parts[0];

  try {
    const dir = await getMediaDirHandle(subdir);
    if (dir) {
      const fileHandle = await dir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    }
  } catch (err) {
    // Continue to fallback check
  }

  // Fallback check in IDB
  try {
    const db = await getDB();
    if (db) {
      const item = await db.get('fallback-blobs', mediaRef);
      if (item && item.blob) {
        return URL.createObjectURL(item.blob);
      }
    }
  } catch (e) {
    console.warn('Fallback blob URL error:', e);
  }

  return null;
}

// Get raw Blob
export async function getMediaBlob(mediaRef: string): Promise<Blob | null> {
  const parts = mediaRef.split('/');
  const subdir = (parts.length > 1 ? parts[0] : 'album') as OPFSSubdir;
  const filename = parts.length > 1 ? parts[1] : parts[0];

  try {
    const dir = await getMediaDirHandle(subdir);
    if (dir) {
      const fileHandle = await dir.getFileHandle(filename);
      return await fileHandle.getFile();
    }
  } catch (err) {
    // Continue to fallback check
  }

  try {
    const db = await getDB();
    if (db) {
      const item = await db.get('fallback-blobs', mediaRef);
      if (item && item.blob) {
        return item.blob;
      }
    }
  } catch (e) {
    console.warn('Blob retrieval error:', e);
  }

  return null;
}

// Delete media file
export async function deleteMediaFile(mediaRef: string): Promise<void> {
  const parts = mediaRef.split('/');
  const subdir = (parts.length > 1 ? parts[0] : 'album') as OPFSSubdir;
  const filename = parts.length > 1 ? parts[1] : parts[0];

  try {
    const dir = await getMediaDirHandle(subdir);
    if (dir) {
      await dir.removeEntry(filename);
    }
  } catch (err) {
    // Ignore if not present in OPFS
  }

  try {
    const db = await getDB();
    if (db) {
      await db.delete('fallback-blobs', mediaRef);
    }
  } catch (e) {
    // Ignore
  }
}

// Wipe all OPFS media
export async function clearAllMediaFiles(): Promise<void> {
  if (!isOPFSSupported()) return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(ROOT_DIR_NAME, { recursive: true });
  } catch (err) {
    console.warn('OPFS clear error:', err);
  }
}

// Export all data (IDB + OPFS) into a single secure in-memory zip archive
export async function exportAllDataToZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Gather all IDB stores in-memory
  const [profile, goals, scripts, journal, settings] = await Promise.all([
    getProfile(),
    getAllGoals(),
    getAllScriptPages(),
    getAllJournalEntries(),
    getAppSettings(),
  ]);

  const dataFolder = zip.folder('data');
  if (dataFolder) {
    dataFolder.file('profile.json', JSON.stringify(profile || {}, null, 2));
    dataFolder.file('goals.json', JSON.stringify(goals, null, 2));
    dataFolder.file('scripts.json', JSON.stringify(scripts, null, 2));
    dataFolder.file('journal.json', JSON.stringify(journal, null, 2));
    dataFolder.file('settings.json', JSON.stringify(settings, null, 2));
  }

  // 2. Gather OPFS files securely
  const mediaFolder = zip.folder('media');
  const subdirs: OPFSSubdir[] = ['album', 'journal-attachments', 'teleprompter-recordings'];

  for (const sub of subdirs) {
    const subFolder = mediaFolder?.folder(sub);
    try {
      const dirHandle = await getMediaDirHandle(sub);
      if (dirHandle && subFolder) {
        // @ts-ignore
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'file') {
            const file = await (handle as FileSystemFileHandle).getFile();
            subFolder.file(name, file);
          }
        }
      }
    } catch (err) {
      console.warn(`Error reading ${sub} for export:`, err);
    }
  }

  // Also include any fallback blobs
  try {
    const db = await getDB();
    if (db) {
      const fallbackItems = await db.getAll('fallback-blobs');
      for (const item of fallbackItems) {
        if (item && item.name && item.blob) {
          mediaFolder?.file(item.name, item.blob);
        }
      }
    }
  } catch (e) {
    console.warn('Error archiving fallback blobs:', e);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
