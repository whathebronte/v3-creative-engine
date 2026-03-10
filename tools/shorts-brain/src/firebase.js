import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
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
 * Upload a JSON blob to Storage
 */
async function uploadJSON(path, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'application/json' });
}

/**
 * Download and parse a JSON blob from Storage
 */
async function downloadJSON(path) {
  const storageRef = ref(storage, path);
  const url = await getDownloadURL(storageRef);
  const res = await fetch(url);
  return res.json();
}

/**
 * Save a weekly snapshot — raw CSVs + processed JSON to Storage, metadata to Firestore
 */
export async function saveSnapshot({ weekId, reportingDate, globalData, regionalData, rawFiles }) {
  const basePath = `shorts-brain/weekly/${weekId}`;

  // Upload raw CSV files to Storage
  if (rawFiles) {
    for (const [key, file] of Object.entries(rawFiles)) {
      if (!file) continue;
      const storageRef = ref(storage, `${basePath}/raw/${key}.csv`);
      await uploadBytes(storageRef, file, { contentType: 'text/csv' });
    }
  }

  // Upload processed data as JSON to Storage (bypasses callable size limits)
  if (globalData) {
    await uploadJSON(`${basePath}/processed/globalData.json`, globalData);
  }
  if (regionalData) {
    await uploadJSON(`${basePath}/processed/regionalData.json`, regionalData);
  }

  // Save lightweight metadata to Firestore (no large data)
  const rawFileKeys = rawFiles ? Object.keys(rawFiles).filter(k => rawFiles[k]) : [];
  const metadata = {
    weekId,
    reportingDate: reportingDate || null,
    savedAt: serverTimestamp(),
    markets: regionalData ? Object.keys(regionalData) : [],
    globalCount: Array.isArray(globalData) ? globalData.length : 0,
    regionalCounts: regionalData
      ? Object.fromEntries(Object.entries(regionalData).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]))
      : {},
    rawFileKeys,
    hasProcessedData: !!(globalData || regionalData)
  };

  await setDoc(doc(db, COLLECTION, weekId), metadata, { merge: true });

  return { weekId, savedAt: new Date().toISOString() };
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
      markets: data.markets,
      globalCount: data.globalCount,
      regionalCounts: data.regionalCounts
    });
  });

  return { snapshots, count: snapshots.length };
}

/**
 * Load full snapshot data for specific weeks (fetches processed JSON from Storage)
 */
export async function loadSnapshots(weekIds) {
  const snapshots = [];
  for (const weekId of weekIds) {
    const basePath = `shorts-brain/weekly/${weekId}/processed`;
    try {
      const [globalData, regionalData] = await Promise.all([
        downloadJSON(`${basePath}/globalData.json`).catch(() => []),
        downloadJSON(`${basePath}/regionalData.json`).catch(() => ({}))
      ]);
      snapshots.push({ weekId, globalData, regionalData });
    } catch (err) {
      console.error(`Failed to load snapshot ${weekId}:`, err);
    }
  }
  return { snapshots, count: snapshots.length };
}

/**
 * Delete a snapshot (Storage files + Firestore doc)
 */
export async function deleteSnapshot(weekId) {
  // Delete all storage files for this week
  const basePath = `shorts-brain/weekly/${weekId}`;
  try {
    const listRef = ref(storage, basePath);
    // List and delete all files recursively (raw/ and processed/ subdirs)
    for (const prefix of ['raw', 'processed']) {
      const subRef = ref(storage, `${basePath}/${prefix}`);
      try {
        const list = await listAll(subRef);
        await Promise.all(list.items.map(item => deleteObject(item).catch(() => {})));
      } catch { /* no files to delete */ }
    }
  } catch { /* no files to delete */ }

  // Delete Firestore doc
  await deleteDoc(doc(db, COLLECTION, weekId));

  return { deleted: weekId };
}
