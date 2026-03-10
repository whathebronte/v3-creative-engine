import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getBytes, listAll, deleteObject } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDocs, collection, query, orderBy, where, limit, deleteDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const COLLECTION = 'shorts_brain_snapshots';

/**
 * Get ISO week ID from a date string
 */
export function getWeekId(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Download a file from Storage as text (uses SDK getBytes, no CORS needed)
 */
async function downloadText(path) {
  const storageRef = ref(storage, path);
  const bytes = await getBytes(storageRef);
  return new TextDecoder().decode(bytes);
}

/**
 * Save a weekly snapshot — raw CSVs to Storage, metadata to Firestore.
 * Raw CSVs are the source of truth; they get re-parsed on load.
 */
export async function saveSnapshot({ weekId, reportingDate, rawFiles }) {
  const basePath = `shorts-brain/weekly/${weekId}`;

  // Upload raw CSV files to Storage
  const savedKeys = [];
  if (rawFiles) {
    for (const [key, file] of Object.entries(rawFiles)) {
      if (!file) continue;
      const storageRef = ref(storage, `${basePath}/${key}.csv`);
      await uploadBytes(storageRef, file, { contentType: 'text/csv' });
      savedKeys.push(key);
    }
  }

  // Save lightweight metadata to Firestore
  const metadata = {
    weekId,
    reportingDate: reportingDate || null,
    savedAt: serverTimestamp(),
    rawFileKeys: savedKeys
  };

  await setDoc(doc(db, COLLECTION, weekId), metadata, { merge: true });

  return { weekId, savedAt: new Date().toISOString(), fileCount: savedKeys.length };
}

/**
 * Load snapshot metadata (list of available weeks)
 */
export async function loadSnapshotIndex(year) {
  let q = query(collection(db, COLLECTION), orderBy('weekId', 'desc'), limit(52));
  if (year) {
    q = query(collection(db, COLLECTION), orderBy('weekId', 'desc'),
      where('weekId', '>=', `${year}-W01`), where('weekId', '<=', `${year}-W53`), limit(52));
  }

  const snap = await getDocs(q);
  const snapshots = [];
  snap.forEach(d => {
    const data = d.data();
    snapshots.push({
      weekId: data.weekId,
      reportingDate: data.reportingDate,
      savedAt: data.savedAt,
      rawFileKeys: data.rawFileKeys || []
    });
  });

  return { snapshots, count: snapshots.length };
}

/**
 * Load raw CSV files for a snapshot week.
 * Returns an object matching the uploadedFiles structure so the app can re-parse them.
 */
export async function loadSnapshotFiles(weekId) {
  const basePath = `shorts-brain/weekly/${weekId}`;

  // List all files in the week's directory
  const listRef = ref(storage, basePath);
  let items = [];
  try {
    // List files at root level (flat structure)
    const rootList = await listAll(listRef);
    items = rootList.items;
    // Also check raw/ subdirectory (newer format)
    if (rootList.prefixes.length > 0) {
      for (const prefix of rootList.prefixes) {
        const subList = await listAll(prefix);
        items = items.concat(subList.items);
      }
    }
  } catch (err) {
    console.error('Failed to list snapshot files:', err);
    return null;
  }

  // Download all CSV files as text
  const csvFiles = {};
  await Promise.all(items.map(async (item) => {
    if (!item.name.endsWith('.csv')) return;
    try {
      const text = await downloadText(item.fullPath);
      // Extract key from filename (e.g., "pct-global.csv" -> "pct-global")
      const key = item.name.replace('.csv', '');
      csvFiles[key] = text;
    } catch (err) {
      console.error(`Failed to download ${item.fullPath}:`, err);
    }
  }));

  return csvFiles;
}

/**
 * Delete a snapshot (Storage files + Firestore doc)
 */
export async function deleteSnapshot(weekId) {
  const basePath = `shorts-brain/weekly/${weekId}`;
  try {
    const listRef = ref(storage, basePath);
    const rootList = await listAll(listRef);
    // Delete root-level files
    await Promise.all(rootList.items.map(item => deleteObject(item).catch(() => {})));
    // Delete subdirectory files
    for (const prefix of rootList.prefixes) {
      const subList = await listAll(prefix);
      await Promise.all(subList.items.map(item => deleteObject(item).catch(() => {})));
    }
  } catch { /* no files to delete */ }

  await deleteDoc(doc(db, COLLECTION, weekId));

  return { deleted: weekId };
}
