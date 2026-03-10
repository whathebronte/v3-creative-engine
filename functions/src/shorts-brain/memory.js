/**
 * Shorts Brain Memory System
 *
 * Stores weekly analysis snapshots in Firestore and raw CSVs in Cloud Storage.
 * Each week's upload builds on the previous, creating a cumulative performance record.
 *
 * Storage structure:
 *   shorts-brain/weekly/{YYYY-WXX}/{stream}/{slot}.csv
 *
 * Firestore structure:
 *   shorts_brain_snapshots/{YYYY-WXX} — weekly processed metric snapshots
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

const db = admin.firestore();
const bucket = admin.storage().bucket();

const COLLECTION = 'shorts_brain_snapshots';

/**
 * Get ISO week number from a date string (YYYY-MM-DD)
 */
function getWeekId(dateStr) {
  if (!dateStr) {
    const now = new Date();
    dateStr = now.toISOString().split('T')[0];
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Save a weekly snapshot — stores processed metrics in Firestore
 * and raw CSV files in Cloud Storage.
 */
const saveSnapshot = async (data, context) => {
  const { weekId, reportingDate, globalData, regionalData, files } = data;

  if (!weekId || !globalData) {
    throw new functions.https.HttpsError('invalid-argument', 'weekId and globalData are required');
  }

  const snapshotRef = db.collection(COLLECTION).doc(weekId);

  // Store raw CSV files in Cloud Storage
  const storedFiles = {};
  if (files) {
    for (const [key, fileData] of Object.entries(files)) {
      if (!fileData || !fileData.content) continue;
      const storagePath = `shorts-brain/weekly/${weekId}/${key}.csv`;
      const file = bucket.file(storagePath);
      await file.save(fileData.content, {
        contentType: 'text/csv',
        metadata: { originalName: fileData.name || `${key}.csv` }
      });
      storedFiles[key] = {
        storagePath,
        originalName: fileData.name || `${key}.csv`,
        size: fileData.content.length
      };
    }
  }

  // Compact the metric data for storage — only store non-zero values
  const compactGlobal = compactMetrics(globalData);
  const compactRegional = {};
  if (regionalData) {
    for (const [market, campaigns] of Object.entries(regionalData)) {
      compactRegional[market] = compactMetrics(campaigns);
    }
  }

  const snapshot = {
    weekId,
    reportingDate: reportingDate || null,
    savedAt: admin.firestore.FieldValue.serverTimestamp(),
    globalData: compactGlobal,
    regionalData: compactRegional,
    storedFiles,
    markets: Object.keys(compactRegional),
    globalCount: compactGlobal.length,
    regionalCounts: Object.fromEntries(
      Object.entries(compactRegional).map(([k, v]) => [k, v.length])
    )
  };

  await snapshotRef.set(snapshot, { merge: true });

  return { weekId, savedAt: new Date().toISOString(), storedFileCount: Object.keys(storedFiles).length };
};

/**
 * Load all snapshots — returns a list of available weeks and their data.
 * Optionally filter by year or load specific weeks.
 */
const loadSnapshots = async (data, context) => {
  const { year, weekIds, metaOnly } = data || {};

  let query = db.collection(COLLECTION).orderBy('weekId', 'desc');

  if (year) {
    query = query.where('weekId', '>=', `${year}-W01`).where('weekId', '<=', `${year}-W53`);
  }

  const snap = await query.limit(52).get();
  const snapshots = [];

  snap.forEach(doc => {
    const d = doc.data();
    if (weekIds && !weekIds.includes(d.weekId)) return;
    if (metaOnly) {
      snapshots.push({
        weekId: d.weekId,
        reportingDate: d.reportingDate,
        savedAt: d.savedAt,
        markets: d.markets,
        globalCount: d.globalCount,
        regionalCounts: d.regionalCounts
      });
    } else {
      snapshots.push(d);
    }
  });

  return { snapshots, count: snapshots.length };
};

/**
 * Delete a specific weekly snapshot
 */
const deleteSnapshot = async (data, context) => {
  const { weekId } = data;
  if (!weekId) throw new functions.https.HttpsError('invalid-argument', 'weekId is required');

  // Delete storage files
  const [files] = await bucket.getFiles({ prefix: `shorts-brain/weekly/${weekId}/` });
  await Promise.all(files.map(f => f.delete().catch(() => {})));

  // Delete Firestore document
  await db.collection(COLLECTION).doc(weekId).delete();

  return { deleted: weekId };
};

/**
 * Compact metrics for storage — strips zero-value entries to save space.
 */
function compactMetrics(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(row => {
    const compact = {
      country: row.country,
      isAnchor: row.isAnchor || false,
      campaignStartDate: row.campaignStartDate || null,
      campaignEndDate: row.campaignEndDate || null,
      optimisationEndDate: row.optimisationEndDate || null,
      segmentTag: row.segmentTag || null,
      metrics: {}
    };

    if (row.metrics) {
      for (const [mType, genders] of Object.entries(row.metrics)) {
        for (const [gender, ages] of Object.entries(genders)) {
          for (const [age, node] of Object.entries(ages)) {
            if (node.v !== 0 || node.sig !== 0 || node.abs !== 0 || node.isPaused) {
              if (!compact.metrics[mType]) compact.metrics[mType] = {};
              if (!compact.metrics[mType][gender]) compact.metrics[mType][gender] = {};
              compact.metrics[mType][gender][age] = {
                v: node.v,
                sig: node.sig,
                abs: node.abs,
                ...(node.isPaused ? { isPaused: true, launchDate: node.launchDate } : {})
              };
            }
          }
        }
      }
    }

    return compact;
  });
}

module.exports = { saveSnapshot, loadSnapshots, deleteSnapshot, getWeekId };
