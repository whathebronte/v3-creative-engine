/**
 * Minimal RFC4180 CSV parser.
 * Handles quoted fields with embedded commas, newlines, and escaped quotes.
 * Returns { headers, rows } where rows are objects keyed by header.
 */
export function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (c === '\r') {
      i++;
      continue;
    }

    if (c === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      i++;
      continue;
    }

    field += c;
    i++;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim());
  const objects = rows.slice(1)
    .filter((r) => r.some((cell) => cell && cell.trim() !== ''))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? '';
      });
      return obj;
    });

  return { headers, rows: objects };
}

/**
 * Heuristic format detection by headers.
 */
export function detectFormat(headers) {
  const set = new Set(headers.map((h) => h.toLowerCase()));
  if (set.has('topic name') && set.has('trend velocity') && set.has('content quality')) {
    return 'vayner';
  }
  if (set.has('external_video_id') && set.has('audio_id')) {
    return 'nyancat';
  }
  return 'unknown';
}
