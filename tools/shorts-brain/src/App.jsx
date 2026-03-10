import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe, RefreshCcw, Brain, MapPin, Sparkles, Download,
  Layers, Zap, Play, TrendingUp, Users,
  Target, ZapOff,
  UploadCloud, ClipboardCheck, Flag,
  Wand2, Palette, Component as ComponentIcon,
  ChevronDown, ChevronUp, FolderKanban, Lightbulb, Copy, Edit2, Save, Plus,
  RotateCcw, Binary, Power, Settings2, Trash2,
  Target as TargetIcon, Database, Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { saveSnapshot, loadSnapshotIndex, loadSnapshotFiles, deleteSnapshot, getWeekId } from './firebase.js';

/**
 * SHORTS BRAIN 2.0 - APAC Marketing Incrementality Hub
 */

// --- 1. CONFIGURATION & CONSTANTS ---
const M_TYPES = ['DAU-SCT', 'DAC-SCT', 'GenAI DAU-SCT'];
const MARKET_SEGMENTS = ['India', 'Indonesia', 'Japan', 'South Korea', 'AUNZ'];
const MARKET_KEYS = { 'India': 'IN', 'Indonesia': 'ID', 'Japan': 'JP', 'South Korea': 'KR', 'AUNZ': 'AUNZ' };
const MARKET_KEYS_REV = { 'IN': 'India', 'ID': 'Indonesia', 'JP': 'Japan', 'KR': 'South Korea', 'AUNZ': 'AUNZ' };
const AO_CATEGORIES = ['SSC', 'Shelf', 'UTS', 'MVR'];

const GENDERS_KEYS = ['female', 'male', 'total'];
const GENDERS_DISPLAY = ['FEMALE', 'MALE', 'GenPop'];
const AGE_BUCKETS = ['18-24', '25-34', '18-34', '35+', 'total'];
const AGE_BUCKETS_DISPLAY = ['18-24', '25-34', '18-34', '35+', 'GenPop'];

const OKR_TARGETS = {
  'APAC': 0.15, 'INDIA': 0.16, 'INDONESIA': 0.29, 'JAPAN': 1.2, 'SOUTH KOREA': 1.08, 'AUNZ': 1.56,
  'IN': 0.16, 'ID': 0.29, 'JP': 1.2, 'KR': 1.08
};

const NAV_ITEMS = [
  { id: 'Upload', label: 'Data Ingestion', icon: UploadCloud },
  { id: 'OKR', label: 'Shorts OKR Performance', icon: TargetIcon },
  { id: 'Global Hub', label: 'Global Holdback', icon: Globe },
  { id: 'Market Hub', label: 'Campaign Holdback', icon: Layers },
];

const CAMPAIGN_CHILDREN = [
  { id: 'AlwaysOn', label: 'Always-On', icon: Zap },
  { id: 'ScaledCreation', label: 'Scaled Creation', icon: Sparkles },
  { id: 'Trends', label: 'Trends', icon: TrendingUp },
  { id: 'CultMo', label: 'CultMo', icon: ComponentIcon },
  { id: 'ArtMo', label: 'ArtMo', icon: Palette },
  { id: 'GenAI Hub', label: 'GenAI Hub', icon: Wand2 }
];

const DEMO_PERMS = [
  { g: 'total', a: 'total', label: 'GenPop' },
  { g: 'total', a: '18-34', label: 'GenPop 18-34' },
  { g: 'total', a: '18-24', label: 'GenPop 18-24' },
  { g: 'total', a: '25-34', label: 'GenPop 25-34' },
  { g: 'total', a: '35+', label: 'GenPop 35+' },
  { g: 'male', a: 'total', label: 'Male GenPop' },
  { g: 'female', a: 'total', label: 'Female GenPop' },
  { g: 'female', a: '18-34', label: 'Female 18-34' },
  { g: 'female', a: '18-24', label: 'Female 18-24' },
  { g: 'female', a: '25-34', label: 'Female 25-34' },
  { g: 'female', a: '35+', label: 'Female 35+' },
  { g: 'male', a: '18-34', label: 'Male 18-34' },
  { g: 'male', a: '18-24', label: 'Male 18-24' },
  { g: 'male', a: '25-34', label: 'Male 25-34' },
  { g: 'male', a: '35+', label: 'Male 35+' }
];

// --- 2. GLOBAL UTILITIES ---

const cleanStr = (s) => (s || '').toString().replace(/['"]/g, '').replace(/\u00A0/g, ' ').trim();
const superClean = (s) => cleanStr(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
const eq = (a, b) => superClean(a) === superClean(b);

const robustParseDate = (dateStr) => {
  const d = cleanStr(dateStr);
  if (!d || d === '-' || d === 'Unknown') return null;
  try {
    if (d.includes('-') && d.split('-')[0].length === 4) return d;
    const parts = d.split(/[-/]/);
    if (parts.length === 3) {
      let v1 = parseInt(parts[0], 10), v2 = parseInt(parts[1], 10), y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      let month, day;
      if (v1 > 12) { day = v1; month = v2; }
      else if (v2 > 12) { month = v1; day = v2; }
      else { month = v1; day = v2; }
      return `${y}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch { return null; }
};

const calcDaysLive = (startStr, optEndStr) => {
  const start = robustParseDate(startStr);
  const end = robustParseDate(optEndStr) || new Date().toISOString().split('T')[0];
  if (!start) return 0;
  try {
    const s = new Date(start), e = new Date(end);
    const diffDays = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : 1;
  } catch { return 0; }
};

const isCampaignEnded = (optEndDateStr, campaignEndDateStr) => {
  const optDate = robustParseDate(optEndDateStr);
  const campDate = robustParseDate(campaignEndDateStr);
  if (!optDate || !campDate) return false;
  try { return new Date(optDate) >= new Date(campDate); } catch { return false; }
};

const splitCSVLine = (line) => {
  const columns = [];
  let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { columns.push(current.trim()); current = ""; }
    else { current += char; }
  }
  columns.push(current.trim());
  return columns;
};

const findHeader = (headers, targets) => {
  const upperHeaders = headers.map(h => (h || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
  const targetUpper = targets.map(t => t.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  for (const target of targetUpper) {
    const idx = upperHeaders.indexOf(target);
    if (idx !== -1) return idx;
  }
  return upperHeaders.findIndex(h => targetUpper.some(t => h.includes(t)));
};

const findMetadata = (rowKey, metaMap) => {
  const key = superClean(rowKey);
  if (!key) return {};
  if (metaMap[key]) return metaMap[key];
  const allMetaKeys = Object.keys(metaMap);
  const fuzzyMatch = allMetaKeys.find(mKey => mKey.length >= 5 && (key.includes(mKey) || mKey.includes(key)));
  return fuzzyMatch ? metaMap[fuzzyMatch] : {};
};

const parseCSVData = (text, existingAcc = {}, metaMap = {}, searchPriority = ['Campaign', 'Campaign Name', 'Country', 'Market'], forceAbs = false) => {
  try {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return existingAcc;
    const headers = splitCSVLine(lines[0]);
    const identifierIdx = findHeader(headers, searchPriority);
    const valTypeIdx = findHeader(headers, ['Value Type', 'Metric Type']);
    const sliceIdx = findHeader(headers, ['Slice']);

    if (identifierIdx === -1 || valTypeIdx === -1) return existingAcc;
    const acc = { ...existingAcc };

    lines.slice(1).forEach(line => {
      const columns = splitCSVLine(line);
      const rowValTypeRaw = (columns[valTypeIdx] || '').replace(/['"]/g, '').trim().toUpperCase();
      const rowSlice = sliceIdx !== -1 ? (columns[sliceIdx] || '').replace(/['"]/g, '').trim().toUpperCase() : '';

      const isRatioRow = !forceAbs && (rowValTypeRaw === 'RATIO (%)' || rowValTypeRaw === 'RATIO' || rowValTypeRaw.includes('LIFT'));
      const isAbsRow = forceAbs && rowValTypeRaw === 'DELTA' && rowSlice === 'CONTROL';
      const isSigRow = rowValTypeRaw.includes('TREND FAVORABILITY');

      if (!isRatioRow && !isSigRow && !isAbsRow) return;

      const rowKey = cleanStr(columns[identifierIdx]) || 'Unknown';
      if (!acc[rowKey]) {
        const meta = findMetadata(rowKey, metaMap);
        acc[rowKey] = {
          country: rowKey,
          metrics: {},
          isAnchor: superClean(rowKey).includes('GLOBALHOLDBACK'),
          campaignStartDate: meta.campaignStartDate || null,
          campaignEndDate: meta.campaignEndDate || null,
          optimisationEndDate: meta.optimisationEndDate || null,
          segmentTag: meta.subTab || 'Campaign Hub',
          meta: meta
        };
        M_TYPES.forEach(m => {
          acc[rowKey].metrics[m] = { female: {}, male: {}, total: {} };
          GENDERS_KEYS.forEach(g => {
            AGE_BUCKETS.forEach(a => acc[rowKey].metrics[m][g][a] = { v: 0, sig: 0, abs: 0, isPaused: false, launchDate: null });
          });
        });
      }

      let gender = 'total';
      const gIdx = findHeader(headers, ['Gender']);
      if (gIdx !== -1) {
        const rawG = (columns[gIdx] || '').toLowerCase().trim();
        if (rawG === 'female' || rawG === 'f') gender = 'female';
        else if (rawG === 'male' || rawG === 'm') gender = 'male';
      }

      let age = 'total';
      const aIdx = findHeader(headers, ['Age', 'Age Group']);
      if (aIdx !== -1) {
        const rawA = (columns[aIdx] || '').toLowerCase().trim();
        if (rawA.includes('18-24')) age = '18-24';
        else if (rawA.includes('25-34')) age = '25-34';
        else if (rawA.includes('18-34')) age = '18-34';
        else if (rawA.includes('35')) age = '35+';
      }

      M_TYPES.forEach(m => {
        const aliases = {
          'DAU-SCT': ['DAILY SHORTS CREATION TOOL ACTIVE USERS', 'DAU-SCT'],
          'DAC-SCT': ['DAILY SHORTS CONVERTERS', 'DAC-SCT'],
          'GenAI DAU-SCT': ['GENAI DAU', 'GENAI DAILY ACTIVE USERS']
        };
        const targetCol = headers.findIndex(h => {
          const hUpper = h.toUpperCase();
          const matchAlias = (aliases[m] || []).some(alias => hUpper.includes(alias));
          const isCI = hUpper.includes('CONFIDENCE') || hUpper.includes('BOUND');
          return matchAlias && !isCI && (m !== 'DAU-SCT' || !hUpper.includes('GENAI'));
        });

        if (targetCol === -1) return;
        const rawCell = (columns[targetCol] || '').replace(/['"]/g, '').trim();
        const numericVal = parseFloat(rawCell.replace(/[^\d.-]/g, '')) || 0;

        if (isRatioRow) acc[rowKey].metrics[m][gender][age].v = numericVal;
        else if (isAbsRow) acc[rowKey].metrics[m][gender][age].abs = numericVal;
        else if (isSigRow) {
          const sigText = rawCell.toUpperCase();
          acc[rowKey].metrics[m][gender][age].sig = (sigText.includes('POSITIVE') || sigText.includes('SSP')) ? 1 : (sigText.includes('NEGATIVE') || sigText.includes('SSN') ? -1 : 0);
        }
      });
    });
    return acc;
  } catch { return existingAcc; }
};

const getStatusConfig = (pi, off) => off
  ? { cardBg: 'bg-[#1a1a1a]', color: 'text-[#808080]', accent: 'bg-[#3a3a3a]' }
  : (pi >= 100
    ? { cardBg: 'bg-[#0a1f0a]', color: 'text-emerald-400', accent: 'bg-emerald-500' }
    : (pi >= 70
      ? { cardBg: 'bg-[#1a1a1a]', color: 'text-amber-400', accent: 'bg-amber-500' }
      : { cardBg: 'bg-[#1a0a0a]', color: 'text-red-400', accent: 'bg-red-500' }));

// --- 3. UI VIEW COMPONENTS ---

const MetricControlHub = ({ activeMetrics, toggleMetric, handleAllToggle }) => (
  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
    <div className="flex flex-wrap gap-2 bg-black p-1 rounded-lg border border-[#3a3a3a]">
      {M_TYPES.map(m => (
        <button key={m} onClick={() => toggleMetric(m)} className={`px-5 py-2.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${activeMetrics.includes(m) ? 'bg-[#FF0000] text-white' : 'text-[#808080] hover:text-white'}`}>
          {m}
        </button>
      ))}
    </div>
    <button onClick={handleAllToggle} className={`px-6 py-2.5 rounded-md text-[10px] font-bold tracking-widest uppercase border transition-all cursor-pointer ${activeMetrics.length === M_TYPES.length ? 'bg-white text-black border-white' : 'bg-transparent text-[#808080] border-[#3a3a3a] hover:border-[#808080]'}`}>
      {activeMetrics.length === M_TYPES.length ? 'Selective View' : 'Sync All Metrics'}
    </button>
  </div>
);

const MasterTableView = ({ data, activeMetrics, isCampaignView = false }) => {
  const themes = {
    FEMALE: { 1: 'bg-blue-900/40 text-blue-100', 2: 'bg-blue-900/20', 3: 'bg-blue-950/40 text-blue-400' },
    MALE: { 1: 'bg-purple-900/40 text-purple-100', 2: 'bg-purple-900/20', 3: 'bg-purple-950/40 text-purple-400' },
    GenPop: { 1: 'bg-amber-900/80 text-amber-50', 2: 'bg-amber-800/20', 3: 'bg-amber-950 text-amber-400 font-bold' }
  };
  if (!data || data.length === 0) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-6">
      <div className="p-6 rounded-full bg-[#1a1a1a] border border-[#3a3a3a]"><ZapOff className="w-12 h-12 text-[#3a3a3a] animate-pulse" /></div>
      <p className="text-[#808080] font-bold text-sm uppercase tracking-widest">No Data Available</p>
    </div>
  );
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden overflow-x-auto">
      <table className="w-full text-center border-collapse">
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-widest border-b border-[#3a3a3a]">
            <th rowSpan={3} className="px-8 py-8 text-left border-r border-[#3a3a3a] bg-[#1a1a1a] sticky left-0 z-40 text-white min-w-[280px]">
              {isCampaignView ? 'Campaign Name' : 'Country / Market'}
            </th>
            {GENDERS_DISPLAY.map((g, gi) => (
              <th key={g} colSpan={AGE_BUCKETS.length * activeMetrics.length} className={`py-6 border-white/10 ${themes[g][1]} ${gi < GENDERS_DISPLAY.length - 1 ? 'border-r-2 border-white/20' : ''}`}>
                <div className="flex items-center justify-center gap-3"><Users className="w-4 h-4 opacity-50" />{g}</div>
              </th>
            ))}
          </tr>
          <tr className="text-[10px] font-bold uppercase tracking-widest border-b border-[#3a3a3a]">
            {GENDERS_DISPLAY.map((g) => (
              <React.Fragment key={g}>
                {AGE_BUCKETS_DISPLAY.map((a, ai) => (
                  <th key={a} colSpan={activeMetrics.length} className={`py-4 transition-colors ${themes[g][2]} ${ai === AGE_BUCKETS_DISPLAY.length - 1 && GENDERS_DISPLAY.indexOf(g) < GENDERS_DISPLAY.length - 1 ? 'border-r-2 border-white/20' : 'border-r border-white/5'}`}>{a}</th>
                ))}
              </React.Fragment>
            ))}
          </tr>
          <tr className="text-[9px] font-bold uppercase tracking-[0.2em] border-b border-[#3a3a3a]">
            {GENDERS_DISPLAY.map((g) => (
              <React.Fragment key={g}>
                {AGE_BUCKETS.map((a, ai) => (
                  <React.Fragment key={a}>
                    {activeMetrics.map((m, mi) => (
                      <th key={m} className={`py-3 px-3 font-mono ${themes[g][3]} ${ai === AGE_BUCKETS.length - 1 && mi === activeMetrics.length - 1 && GENDERS_DISPLAY.indexOf(g) < GENDERS_DISPLAY.length - 1 ? 'border-r-2 border-white/20' : 'border-r border-white/5'}`}>{m.includes('GenAI') ? 'GenAI' : m.split('-')[0]}</th>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, ri) => (
            <tr key={ri} className={`transition-all duration-200 ${row.isAnchor ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}>
              <td className={`px-8 py-5 text-left border-r border-[#3a3a3a] sticky left-0 z-10 font-bold text-[12px] uppercase tracking-tight bg-[#111] ${row.isAnchor ? 'text-blue-400' : 'text-[#e0e0e0]'}`}>{row.isAnchor ? `${row.country} (Reference)` : row.country}</td>
              {GENDERS_KEYS.map((g) => (
                <React.Fragment key={g}>
                  {AGE_BUCKETS.map((a, ai) => (
                    <React.Fragment key={a}>
                      {activeMetrics.map((m) => {
                        const node = row.metrics[m][g][a];
                        const isEnd = ai === AGE_BUCKETS.length - 1 && activeMetrics.indexOf(m) === activeMetrics.length - 1;
                        let style = "text-slate-500 font-medium", bg = "";

                        if (node.isPaused) {
                          style = "text-[#808080] font-bold";
                          bg = "bg-[#1a1a1a]";
                        }
                        else if (node.sig === -1) { style = "text-red-500 font-bold"; bg = "bg-red-500/10"; }
                        else if (node.sig === 1) { style = "text-emerald-500 font-bold"; bg = "bg-emerald-500/10"; }
                        else if (node.v !== 0) { style = "text-slate-100 font-bold"; }

                        return (
                          <td key={m} className={`py-5 px-3 font-mono text-[13px] tabular-nums ${style} ${bg} ${isEnd && GENDERS_KEYS.indexOf(g) < GENDERS_KEYS.length - 1 ? 'border-r-2 border-white/20' : 'border-r border-white/5'}`}>
                            <div className="flex flex-col items-center text-center">
                              {node.isPaused ? (
                                <>
                                  <span className="leading-none uppercase">Paused</span>
                                  <span className={`text-[7px] opacity-60 font-sans tracking-tight block mt-0.5 font-normal leading-none uppercase italic ${row.isAnchor ? 'text-slate-600' : ''}`}>
                                    {node.launchDate || 'No Data'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span>{node.v === 0 ? '0.00' : (node.v > 0 ? `+${node.v.toFixed(2)}` : `${node.v.toFixed(2)}`)}</span>
                                  {node.abs !== 0 && (
                                    <span className="text-[9px] opacity-50 font-sans tracking-tighter block mt-0.5 font-normal leading-none">
                                      ({node.abs > 0 ? `+${Math.round(node.abs).toLocaleString()}` : Math.round(node.abs).toLocaleString()})
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
};

const OKRAndRecsView = ({ globalData, regionalData, latestDate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editedRows, setEditedRows] = useState({});
  const [manualPointers, setManualPointers] = useState([]);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [deletedRowIds, setDeletedRowIds] = useState(new Set());
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [newManualForm, setNewManualForm] = useState({ country: 'APAC', campaign: '', age: 'GenPop', gender: 'GenPop', recommendation: 'MAINTAIN', justification: '' });

  const showFeedback = (msg) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const daysLeft = useMemo(() => {
    if (!latestDate) return "TBD";
    const endQ = new Date("2026-03-31");
    const current = new Date(latestDate);
    const diffTime = Math.ceil((endQ - current) / (1000 * 60 * 60 * 24));
    return diffTime > 0 ? diffTime : 0;
  }, [latestDate]);

  const okrStats = useMemo(() => {
    return ['APAC', 'India', 'Indonesia', 'Japan', 'South Korea', 'AUNZ'].map(mName => {
      const record = globalData.find(d => eq(d.country, mName) || eq(d.country, MARKET_KEYS[mName]));
      const actual = record?.metrics?.['DAU-SCT']?.total?.total?.v || 0;
      const target = OKR_TARGETS[mName.toUpperCase()] || 1.00;
      return { market: mName.toUpperCase(), actual, target, perfIndex: target > 0 ? (actual / target) * 100 : 0, isOffline: !record };
    });
  }, [globalData]);

  const recommendationRows = useMemo(() => {
    const tableData = [];
    ['APAC', 'India', 'Indonesia', 'Japan', 'South Korea', 'AUNZ'].forEach(mName => {
      const record = globalData.find(d => eq(d.country, mName) || eq(d.country, MARKET_KEYS[mName]));
      if (record) {
        const actual = record.metrics?.['DAU-SCT']?.total?.total?.v || 0;
        const target = OKR_TARGETS[mName.toUpperCase()] || 1.00;
        const perfIndex = (actual / target) * 100;
        let recommendation = "MEET TARGET";
        if (perfIndex < 70) recommendation = "AT RISK";
        else if (perfIndex < 100) recommendation = "ON TRACK";
        tableData.push({ id: `MARKET_${mName}`, country: mName.toUpperCase(), campaign: "GLOBAL HUB AUDIT", age: "GenPop", gender: "GenPop", segment: "MARKET HEALTH", recommendation, justification: `${mName} lift: ${actual.toFixed(3)}% (${perfIndex.toFixed(1)}% of target).`, isMarketAudit: true });
      }
    });

    MARKET_SEGMENTS.forEach(market => {
      const allCampsInMarket = regionalData[market] || [];
      allCampsInMarket.forEach((camp, ci) => {
        if (isCampaignEnded(camp.optimisationEndDate, camp.campaignEndDate)) return;
        const daysNum = calcDaysLive(camp.campaignStartDate, camp.optimisationEndDate);
        const rawTriggers = [];

        DEMO_PERMS.forEach(demo => {
          const node = camp.metrics?.['DAU-SCT']?.[demo.g]?.[demo.a] || { v: 0, sig: 0 };
          const label = demo.label;
          if (node.isPaused) return;
          if (node.sig === -1) rawTriggers.push({ g: demo.g, a: demo.a, label, recommendation: "PAUSE", justification: `Pause ${label}: Stat-sig negative lift (-${Math.abs(node.v).toFixed(2)}%).`, statusType: "danger" });
          else if (demo.g === 'total' && demo.a === 'total' && daysNum > 14 && node.v < -0.01) rawTriggers.push({ g: demo.g, a: demo.a, label, recommendation: "PAUSE", justification: `Pause ${label}: Negative lift observed post-learning.`, statusType: "danger" });
          else if (node.sig === 1 && node.v > 0.001) rawTriggers.push({ g: demo.g, a: demo.a, label, recommendation: "SCALE", justification: `Scale ${label}: Stat-sig positive lift (+${node.v.toFixed(2)}%).`, statusType: "success" });
          else if (demo.g === 'total' && demo.a === 'total' && daysNum <= 14 && daysNum > 0) rawTriggers.push({ g: demo.g, a: demo.a, label, recommendation: "MAINTAIN", justification: "Learning phase stage (<14d).", statusType: "warning" });
        });

        if (rawTriggers.length > 0) {
          const recTypes = ['PAUSE', 'SCALE', 'MAINTAIN'];
          recTypes.forEach(rt => {
            let group = rawTriggers.filter(t => t.recommendation === rt);
            if (group.length === 0) return;
            const maleT = group.find(t => t.g === 'male' && t.a === 'total');
            const femaleT = group.find(t => t.g === 'female' && t.a === 'total');
            if (maleT && femaleT) {
              const existingGenPop = group.find(t => t.g === 'total' && t.a === 'total');
              if (!existingGenPop) group.push({ g: 'total', a: 'total', label: 'GenPop', recommendation: rt, justification: `Consolidated ${rt}: Impact observed across GenPop.`, statusType: maleT.statusType });
              group = group.filter(t => !(t.a === 'total' && (t.g === 'male' || t.g === 'female')));
            }
            const toPrune = new Set();
            group.forEach(t1 => {
              group.forEach(t2 => {
                if (t1 === t2 || toPrune.has(t2)) return;
                if (t1.g === 'total' && t1.a === 'total') { toPrune.add(t2); return; }
                if (t1.a === 'total' && t1.g === t2.g && t2.a !== 'total') { toPrune.add(t2); return; }
                if (t1.a === '18-34' && (t2.a === '18-24' || t2.a === '25-34') && t1.g === t2.g) { toPrune.add(t2); return; }
              });
            });
            group.forEach((t, ti) => {
              if (!toPrune.has(t)) tableData.push({ ...t, id: `CAMP_${market}_${ci}_${rt}_${ti}`, country: MARKET_KEYS[market] || market.toUpperCase(), campaign: camp.country, segment: camp.segmentTag || 'Campaign Hub', daysLive: daysNum.toString(), age: t.a === 'total' ? 'GenPop' : t.a, gender: t.g === 'total' ? 'GenPop' : t.g.toUpperCase() });
            });
          });
        }
      });
    });

    const merged = [...tableData, ...manualPointers].filter(r => !deletedRowIds.has(r.id));
    return merged.map(r => editedRows[r.id] ? { ...r, ...editedRows[r.id] } : r);
  }, [globalData, regionalData, manualPointers, deletedRowIds, editedRows]);

  const handleCopyRow = async (row) => {
    const text = `${row.country}\t${row.campaign}\t${row.age}\t${row.gender}\t${row.recommendation}\t${row.justification}`;
    await copyToClipboard(text);
    showFeedback("Row Copied to Clipboard");
  };

  const handleCopyAll = async () => {
    if (recommendationRows.length === 0) return;
    const headers = "Market\tEntity\tAge\tGender\tDirective\tJustification";
    const body = recommendationRows.map(r => `${r.country}\t${r.campaign}\t${r.age}\t${r.gender}\t${r.recommendation}\t${r.justification}`).join('\n');
    await copyToClipboard(`${headers}\n${body}`);
    showFeedback("Full Matrix Copied for Sheets");
  };

  const handleRestore = () => {
    setDeletedRowIds(new Set()); setEditedRows({}); setManualPointers([]);
    showFeedback("Matrix Restored to Baseline");
  };

  const handleAddNewManual = () => {
    if (!newManualForm.campaign) return;
    const id = `MANUAL_${Date.now()}`;
    setManualPointers(p => [...p, { ...newManualForm, id, statusType: newManualForm.recommendation === 'PAUSE' ? 'danger' : (newManualForm.recommendation === 'SCALE' ? 'success' : 'warning') }]);
    setIsAddingManual(false);
    setNewManualForm({ country: 'APAC', campaign: '', age: 'GenPop', gender: 'GenPop', recommendation: 'MAINTAIN', justification: '' });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-32">
      {copyFeedback && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase">{copyFeedback}</div>}

      <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-12 gap-8 border-b border-[#3a3a3a] pb-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight uppercase">Shorts OKR Performance</h1>

          <div className="flex flex-wrap gap-10 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#808080] uppercase tracking-widest">Quarter Start</p>
              <p className="text-lg font-bold text-white">2026-02-01</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#808080] uppercase tracking-widest">Reporting Date (Latest)</p>
              <p className="text-lg font-bold text-emerald-400">{latestDate || "Awaiting Data..."}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#808080] uppercase tracking-widest">Days Left in Q1</p>
              <p className="text-lg font-bold text-amber-400">
                {daysLeft} <span className="text-[10px] text-[#808080] ml-1 font-normal">days remaining</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        {okrStats.map((stat, idx) => {
          const cfg = getStatusConfig(stat.perfIndex, stat.isOffline);
          return (
            <div key={idx} className={`relative ${cfg.cardBg} rounded-lg p-6 border border-[#3a3a3a] transition-all hover:border-[#555]`}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white uppercase">{stat.market}</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-white">{stat.perfIndex.toFixed(1)}%</span>
                <span className="text-[9px] font-bold text-[#808080] uppercase">INDEX</span>
              </div>
              <div className="relative h-1.5 w-full bg-black rounded-full overflow-hidden mb-4"><div className={`h-full ${cfg.accent}`} style={{ width: `${Math.min(stat.perfIndex, 100)}%` }} /></div>
              <div className="flex justify-between pt-4 border-t border-[#3a3a3a] font-mono text-[10px]">
                <div className="text-[#808080] uppercase">Actual: <span className="text-white">+{stat.actual.toFixed(2)}%</span></div>
                <div className="text-[#808080] uppercase">Target: <span className="text-[#b0b0b0]">{stat.target.toFixed(2)}%</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]"><Lightbulb className="w-6 h-6 text-amber-400" /></div>
            <div><h2 className="text-2xl font-bold text-white uppercase">Strategic Guidance</h2><p className="text-[#808080] text-xs uppercase tracking-widest mt-1">Manual Overrides</p></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setIsAddingManual(true)} className="flex items-center gap-2 bg-[#FF0000] text-white px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500 transition-all"><Plus className="w-4 h-4" /> Add Pointer</button>
            <button onClick={handleCopyAll} className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase hover:bg-[#e0e0e0] transition-all"><Copy className="w-4 h-4" /> Copy All for Sheets</button>
            <button onClick={handleRestore} className="flex items-center gap-2 bg-[#1a1a1a] text-[#808080] px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase hover:text-white transition-all border border-[#3a3a3a]"><RotateCcw className="w-4 h-4" /> Restore Defaults</button>
          </div>
        </div>

        {isAddingManual && (
          <div className="bg-[#1a1a1a] border border-[#FF0000]/30 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div><label className="text-[9px] font-bold text-[#808080] uppercase block mb-2">Market</label><input className="w-full bg-black border border-[#3a3a3a] rounded-md p-2.5 text-[11px] font-bold uppercase outline-none focus:border-[#FF0000] text-white" value={newManualForm.country} onChange={e => setNewManualForm(p => ({...p, country: e.target.value.toUpperCase()}))} /></div>
              <div><label className="text-[9px] font-bold text-[#808080] uppercase block mb-2">Entity</label><input className="w-full bg-black border border-[#3a3a3a] rounded-md p-2.5 text-[11px] font-bold outline-none focus:border-[#FF0000] text-white" placeholder="e.g. Veo Effects" value={newManualForm.campaign} onChange={e => setNewManualForm(p => ({...p, campaign: e.target.value}))} /></div>
              <div><label className="text-[9px] font-bold text-[#808080] uppercase block mb-2">Age</label><input className="w-full bg-black border border-[#3a3a3a] rounded-md p-2.5 text-[11px] font-bold outline-none focus:border-[#FF0000] text-white" value={newManualForm.age} onChange={e => setNewManualForm(p => ({...p, age: e.target.value}))} /></div>
              <div><label className="text-[9px] font-bold text-[#808080] uppercase block mb-2">Gender</label><input className="w-full bg-black border border-[#3a3a3a] rounded-md p-2.5 text-[11px] font-bold outline-none focus:border-[#FF0000] text-white" value={newManualForm.gender} onChange={e => setNewManualForm(p => ({...p, gender: e.target.value}))} /></div>
              <div><label className="text-[9px] font-bold text-[#808080] uppercase block mb-2">Directive</label>
                <select className="w-full bg-black border border-[#3a3a3a] rounded-md p-2.5 text-[11px] font-bold outline-none text-white" value={newManualForm.recommendation} onChange={e => setNewManualForm(p => ({...p, recommendation: e.target.value}))}>
                  <option value="MAINTAIN">MAINTAIN</option><option value="SCALE">SCALE</option><option value="PAUSE">PAUSE</option>
                </select>
              </div>
            </div>
            <textarea className="w-full h-24 bg-black border border-[#3a3a3a] rounded-lg p-3 text-[11px] text-[#b0b0b0] outline-none focus:border-[#FF0000] mb-4" placeholder="Strategic justification context..." value={newManualForm.justification} onChange={e => setNewManualForm(p => ({...p, justification: e.target.value}))} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAddingManual(false)} className="bg-[#1a1a1a] text-[#808080] px-5 py-2.5 rounded-lg hover:text-white font-bold text-[10px] uppercase transition-all border border-[#3a3a3a]">Cancel</button>
              <button onClick={handleAddNewManual} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-500 font-bold text-[10px] uppercase transition-all">Confirm Pointer</button>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#111] text-[#808080] uppercase tracking-widest border-b border-[#3a3a3a] font-bold">
                <th className="px-8 py-6 text-left">Market</th><th className="px-8 py-6 text-left">Entity</th><th className="px-8 py-6 text-center">Age</th><th className="px-8 py-6 text-center">Gender</th><th className="px-8 py-6 text-left">Directive</th><th className="px-8 py-6 text-left">Justification</th><th className="px-8 py-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recommendationRows.map(row => (
                <tr key={row.id} className={`hover:bg-white/[0.02] group/row transition-colors ${row.recommendation === 'PAUSE' ? 'bg-red-500/[0.03]' : ''}`}>
                  <td className={`px-8 py-4 font-bold uppercase ${row.isMarketAudit ? 'text-emerald-400' : 'text-blue-400'}`}>{row.country}</td>
                  <td className="px-8 py-4 font-bold text-[#e0e0e0] truncate max-w-[200px]">{row.campaign}</td>
                  <td className="px-8 py-4 text-center text-[#b0b0b0] uppercase">{row.age}</td>
                  <td className="px-8 py-4 text-center text-[#b0b0b0] uppercase">{row.gender}</td>

                  <td className="px-8 py-4 font-bold">
                    {editingId === row.id ? (
                      <select className="bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] outline-none" value={editedRows[row.id]?.recommendation || row.recommendation} onChange={e => setEditedRows(p => ({...p, [row.id]: {...(p[row.id] || row), recommendation: e.target.value}}))}>
                        <option value="MAINTAIN">MAINTAIN</option><option value="SCALE">SCALE</option><option value="PAUSE">PAUSE</option>
                      </select>
                    ) : (
                      <span className={`${row.recommendation === 'PAUSE' ? 'text-red-400' : (row.recommendation === 'SCALE' ? 'text-emerald-400' : 'text-amber-400')}`}>{row.recommendation}</span>
                    )}
                  </td>

                  <td className="px-8 py-4 text-[#808080] max-w-[300px] leading-relaxed">
                    {editingId === row.id ? (
                      <textarea className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] outline-none min-h-[60px]" value={editedRows[row.id]?.justification || row.justification} onChange={e => setEditedRows(p => ({...p, [row.id]: {...(p[row.id] || row), justification: e.target.value}}))} />
                    ) : row.justification}
                  </td>

                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      {editingId === row.id ? (
                        <button onClick={() => setEditingId(null)} className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"><Save className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => setEditingId(row.id)} title="Edit Row" className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"><Edit2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleCopyRow(row)} title="Copy Row" className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setDeletedRowIds(p => new Set(p).add(row.id))} title="Delete Pointer" className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-red-500 hover:bg-white/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LandingPage = ({ uploadedFiles, handleFileUpload, startAnalysis, isAnalyzing, memoryIndex, loadHistoricalWeek, isLoadingMemory, historicalSnapshots }) => {
  const HubRow = ({ type, title, icon: Icon, tag }) => (
    <div className={`p-6 rounded-lg border ${type === 'pct' ? 'border-amber-500/30 bg-[#1a1500]' : 'border-blue-500/30 bg-[#0a0a1a]'} mb-6 transition-all`}>
      <div className="flex items-center gap-4 mb-6 px-4">
        <div className={`p-2 rounded-lg flex items-center justify-center ${type === 'pct' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h2 className={`text-lg font-bold uppercase tracking-tight ${type === 'pct' ? 'text-amber-500' : 'text-blue-500'}`}>{title}</h2>
          <p className="text-[8px] font-bold text-[#808080] uppercase tracking-[0.3em]">{tag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left items-stretch">
        <div className="group relative border border-[#3a3a3a] bg-black rounded-lg p-5 flex flex-col items-center hover:border-[#555] transition-all justify-center text-center">
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(type, 'global', e.target.files[0])} />
          <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${uploadedFiles[type].global ? (type === 'pct' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400') : 'bg-[#1a1a1a] text-[#555]'}`}>
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[10px] mb-1.5 uppercase tracking-wider text-[#e0e0e0]">Global Hub</h3>
          <div className="text-[8px] font-mono truncate w-full px-2 py-1.5 rounded bg-black border border-[#3a3a3a] text-[#808080] mb-2 text-center">
            {uploadedFiles[type].global ? uploadedFiles[type].global.name : 'PUSH_MASTER_FILE'}
          </div>
        </div>

        <div className="group relative border border-[#3a3a3a] bg-black rounded-lg p-5 flex flex-col items-center hover:border-[#555] transition-all justify-center">
          <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${Object.keys(uploadedFiles[type].countryHB).length > 0 ? (type === 'pct' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400') : 'bg-[#1a1a1a] text-[#555]'}`}>
            <Flag className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[10px] mb-3 uppercase tracking-wider text-[#e0e0e0]">Market Hub</h3>
          <div className="w-full grid grid-cols-5 gap-1 px-1">
            {MARKET_SEGMENTS.map(m => (
              <div key={m} className="relative aspect-square group/item">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(type, 'countryHB', e.target.files[0], m)} />
                <div className={`w-full h-full rounded-lg border flex items-center justify-center transition-all ${uploadedFiles[type].countryHB[m] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-black border-[#3a3a3a] text-[#555] hover:border-[#808080]'}`}>
                  <span className="text-[7px] font-black uppercase">{MARKET_KEYS[m]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="group relative border border-[#3a3a3a] bg-black rounded-lg p-5 flex flex-col items-center hover:border-[#555] transition-all justify-center">
          <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-all ${Object.keys(uploadedFiles[type].alwaysOn).length > 0 ? (type === 'pct' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400') : 'bg-[#1a1a1a] text-[#555]'}`}>
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[10px] mb-3 uppercase tracking-wider text-[#e0e0e0]">Always-On</h3>
          <div className="w-full grid grid-cols-2 gap-1.5 px-2">
            {AO_CATEGORIES.map(cat => (
              <div key={cat} className="relative h-7 group/item">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(type, 'alwaysOn', e.target.files[0], cat)} />
                <div className={`w-full h-full rounded-lg border flex items-center justify-center transition-all ${uploadedFiles[type].alwaysOn[cat] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-black border-[#3a3a3a] text-[#555] hover:border-[#808080]'}`}>
                  <span className="text-[7px] font-black uppercase">{cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center py-10 px-6 text-[#e0e0e0]">
      <div className="max-w-[1500px] w-full z-10 text-center">
        <div className="mb-8">
          <div className="inline-block mb-4">
            <div className="bg-[#FF0000] w-14 h-14 rounded-xl flex items-center justify-center mx-auto"><Brain className="text-white w-7 h-7" /></div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 uppercase">Shorts Brain <span className="text-[#FF0000]">2.0</span></h1>
          <p className="text-[#808080] text-[10px] font-bold tracking-[0.4em] uppercase">APAC Marketing Hub</p>
        </div>

        <div className="p-6 rounded-lg border border-emerald-500/30 bg-[#0a1a0a] mb-6 transition-all">
          <div className="flex items-center gap-4 mb-6 px-4">
            <div className="p-2 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500">
              <Settings2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold uppercase tracking-tight text-emerald-500">Campaign Shared Meta</h2>
              <p className="text-[8px] font-bold text-[#808080] uppercase tracking-[0.3em]">Structural Definitions & Instructions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <div className="group relative border border-[#3a3a3a] bg-black rounded-lg p-5 flex items-center gap-6 hover:border-[#555] transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${uploadedFiles.shared.campaignInfo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-[#555]'}`}>
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-[10px] font-bold uppercase text-[#e0e0e0] mb-1">Structural Meta</h4>
                <div className="text-[8px] font-mono truncate px-2 py-1.5 rounded bg-black border border-[#3a3a3a] text-[#808080]">
                  {uploadedFiles.shared.campaignInfo ? uploadedFiles.shared.campaignInfo.name : 'PUSH_STRUCTURAL_CSV'}
                </div>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload('shared', 'campaignInfo', e.target.files[0])} />
            </div>
            <div className="group relative border border-[#3a3a3a] bg-black rounded-lg p-5 flex items-center gap-6 hover:border-[#555] transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${uploadedFiles.shared.pauseRelive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-[#555]'}`}>
                <Power className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-[10px] font-bold uppercase text-[#e0e0e0] mb-1">Pause/Relive Instructions</h4>
                <div className="text-[8px] font-mono truncate px-2 py-1.5 rounded bg-black border border-[#3a3a3a] text-[#808080]">
                  {uploadedFiles.shared.pauseRelive ? uploadedFiles.shared.pauseRelive.name : 'PUSH_INSTRUCTIONS_CSV'}
                </div>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload('shared', 'pauseRelive', e.target.files[0])} />
            </div>
          </div>
        </div>

        <HubRow type="pct" title="Percentage Input Hub" tag="Relative Lift Streams" icon={TrendingUp} />
        <HubRow type="abs" title="Absolute Input Hub" tag="Discrete Volume Streams" icon={Binary} />

        <button onClick={startAnalysis} disabled={isAnalyzing} className="px-10 py-4 rounded-lg font-bold text-base bg-[#FF0000] text-white transition-all hover:bg-red-500 flex items-center gap-3 mx-auto uppercase mt-4 border border-[#3a3a3a]">
          {isAnalyzing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isAnalyzing ? 'INITIALIZING...' : 'EXECUTE ANALYSIS'}
        </button>

        {/* Stored Memory Snapshots */}
        {memoryIndex.length > 0 && (
          <div className="mt-10 p-6 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-[#808080]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#808080]">Stored Snapshots</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {memoryIndex.map(snap => (
                <button
                  key={snap.weekId}
                  onClick={() => loadHistoricalWeek(snap.weekId)}
                  disabled={isLoadingMemory}
                  className="border border-[#3a3a3a] bg-black rounded-lg p-4 text-center hover:border-[#FF0000]/50 hover:bg-[#FF0000]/5 transition-all cursor-pointer group"
                >
                  <Clock className="w-4 h-4 text-[#808080] mx-auto mb-2 group-hover:text-[#FF0000]" />
                  <span className="text-xs font-bold block text-white">{snap.weekId}</span>
                  <span className="text-[8px] text-[#808080] block mt-1">{snap.reportingDate || 'No date'}</span>
                  <span className="text-[8px] text-[#555] block">{snap.globalCount || 0} campaigns</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('OKR');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(['DAU-SCT']);
  const [isCampaignTypeExpanded, setIsCampaignTypeExpanded] = useState(false);
  const [activeMarketSubTab, setActiveMarketSubTab] = useState('India');
  const [latestGlobalDate, setLatestGlobalDate] = useState(null);

  const [tabMarketFilter, setTabMarketFilter] = useState({ 'ScaledCreation': 'India', 'Trends': 'India', 'CultMo': 'India', 'ArtMo': 'India', 'GenAI Hub': 'India', 'AlwaysOn': 'India' });
  const [subTabFilter, setSubTabFilter] = useState({ 'ScaledCreation': '', 'Trends': '', 'CultMo': '', 'ArtMo': '', 'GenAI Hub': '', 'AlwaysOn': '' });
  const [subSubTabFilter, setSubSubTabFilter] = useState({ 'ScaledCreation': '', 'Trends': '', 'CultMo': '', 'ArtMo': '', 'GenAI Hub': '', 'AlwaysOn': '' });

  const [globalData, setGlobalData] = useState([]);
  const [regionalData, setRegionalData] = useState({});
  const [campaignHubData, setCampaignHubData] = useState({});

  const [uploadedFiles, setUploadedFiles] = useState({
    pct: { global: null, countryHB: {}, alwaysOn: {} },
    abs: { global: null, countryHB: {}, alwaysOn: {} },
    shared: { campaignInfo: null, pauseRelive: null }
  });

  // Memory system state
  const [memoryIndex, setMemoryIndex] = useState([]);
  const [memoryStatus, setMemoryStatus] = useState('idle'); // idle | saving | saved | error
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [historicalSnapshots, setHistoricalSnapshots] = useState([]);

  const getSubTabs = useCallback((tab, market) => {
    const marketData = campaignHubData[tab]?.[market] || {};
    const keys = Object.keys(marketData).filter(k => k !== 'Generic');
    return keys.length > 0 ? keys.sort() : [];
  }, [campaignHubData]);

  const getSubSubTabs = useCallback((tab, market, sub) => {
    const subData = campaignHubData[tab]?.[market]?.[sub] || {};
    const keys = Object.keys(subData).filter(k => k !== 'Default');
    return keys.length > 0 ? keys.sort() : [];
  }, [campaignHubData]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const readFile = (f) => new Promise(res => { if (!f) res(""); const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsText(f); });

      let metaLookup = {};
      const metaSource = uploadedFiles.shared.campaignInfo;
      if (metaSource) {
        const text = await readFile(metaSource);
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const hdrs = splitCSVLine(lines[0]);
          const cIdx = findHeader(hdrs, ['Campaign', 'Campaign Name']),
                mktIdx = findHeader(hdrs, ['Market', 'Country']),
                tabIdx = findHeader(hdrs, ['Campaign Tabs', 'Tabs', 'Tab']),
                subTabIdx = findHeader(hdrs, ['Campaign Sub tabs', 'Sub tabs', 'Sub tab', 'Sub-tabs', 'Subtab', 'Sub category']),
                subSubTabIdx = findHeader(hdrs, ['Campaign Sub Sub tabs', 'Sub sub tabs', 'Sub-sub-tabs', 'Subsubtab']),
                startIdx = findHeader(hdrs, ['Campaign Start Date', 'Start Date']),
                endIdx = findHeader(hdrs, ['Campaign End Date', 'End Date']),
                optIdx = findHeader(hdrs, ['Optimisation End Date', 'Optimization Date']);

          lines.slice(1).forEach(line => {
            const cols = splitCSVLine(line);
            const name = cleanStr(cols[cIdx]);
            if (name) {
              const rawMkt = cleanStr(cols[mktIdx]);
              const resolvedMkt = MARKET_KEYS_REV[rawMkt.toUpperCase()] || MARKET_SEGMENTS.find(s => eq(s, rawMkt)) || 'India';
              metaLookup[superClean(name)] = { market: resolvedMkt, tab: cleanStr(cols[tabIdx]), subTab: cleanStr(cols[subTabIdx]), subSubTab: cleanStr(cols[subSubTabIdx]), campaignStartDate: cleanStr(cols[startIdx]), campaignEndDate: cleanStr(cols[endIdx]), optimisationEndDate: cleanStr(cols[optIdx]) };
            }
          });
        }
      }

      let instructionMap = {};
      const instrSource = uploadedFiles.shared.pauseRelive;
      if (instrSource) {
        const text = await readFile(instrSource);
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const hdrs = splitCSVLine(lines[0]);
          const cIdx = findHeader(hdrs, ['Campaign', 'Campaign Name']);
          const aIdx = findHeader(hdrs, ['Age', 'Age Group']);
          const gIdx = findHeader(hdrs, ['Gender']);
          const iIdx = findHeader(hdrs, ['Instruction', 'Action']);
          const dIdx = findHeader(hdrs, ['Launch Date', 'Date']);

          lines.slice(1).forEach(l => {
            const cols = splitCSVLine(l);
            const campaign = superClean(cols[cIdx]);
            if (!campaign) return;
            const age = (cols[aIdx] || 'total').toLowerCase().trim().replace(/[^a-z0-9+]/g, '');
            const gender = (cols[gIdx] || 'total').toLowerCase().trim();
            const instr = (cols[iIdx] || '').toUpperCase().trim();
            const date = cleanStr(cols[dIdx]);

            if (!instructionMap[campaign]) instructionMap[campaign] = {};
            if (!instructionMap[campaign][gender]) instructionMap[campaign][gender] = {};
            instructionMap[campaign][gender][age] = { instruction: instr, launchDate: date };
          });
        }
      }

      const structDataTemp = {};
      const routeData = (parsedMap, defaultMarket, forceTab = null, forceSub = null) => {
        Object.values(parsedMap).forEach(row => {
          const meta = row.meta || {};
          let rawTab = forceTab || cleanStr(meta.tab) || 'Uncategorized';
          const matchedChild = CAMPAIGN_CHILDREN.find(child => eq(child.id, rawTab) || eq(child.label, rawTab));
          const tabKey = matchedChild ? matchedChild.id : rawTab;

          const sub = forceSub || cleanStr(meta.subTab) || 'Generic';
          const ssVal = cleanStr(meta.subSubTab) || 'Default';
          const mk = meta.market || defaultMarket;
          const campKey = superClean(row.country);

          const campInstr = instructionMap[superClean(row.country)];
          if (campInstr) {
            M_TYPES.forEach(m => {
              GENDERS_KEYS.forEach(g => {
                AGE_BUCKETS.forEach(a => {
                  const sanA = a.replace(/[^a-z0-9+]/g, '');
                  const parentA = (sanA === '1824' || sanA === '2534') ? '1834' : null;

                  const checkKeys = [
                    [g, sanA],
                    parentA ? [g, parentA] : null,
                    [g, 'total'],
                    ['total', sanA],
                    parentA ? ['total', parentA] : null,
                    ['total', 'total']
                  ].filter(Boolean);

                  let activeDemInstr = null;
                  for (const [tg, ta] of checkKeys) {
                    const found = campInstr[tg]?.[ta];
                    if (found && found.instruction === 'PAUSE' && found.launchDate && found.launchDate.trim() !== '') {
                      activeDemInstr = found;
                      break;
                    }
                  }

                  if (activeDemInstr) {
                    row.metrics[m][g][a].isPaused = true;
                    row.metrics[m][g][a].launchDate = activeDemInstr.launchDate;
                  }
                });
              });
            });
          }

          if (!structDataTemp[tabKey]) structDataTemp[tabKey] = {};
          if (!structDataTemp[tabKey][mk]) structDataTemp[tabKey][mk] = {};
          if (!structDataTemp[tabKey][mk][sub]) structDataTemp[tabKey][mk][sub] = {};
          if (!structDataTemp[tabKey][mk][sub][ssVal]) structDataTemp[tabKey][mk][sub][ssVal] = {};
          structDataTemp[tabKey][mk][sub][ssVal][campKey] = row;
        });
      };

      let detectedGlobalDate = null;
      const processStream = async (streamType, isAbs = false) => {
        const stream = uploadedFiles[streamType];
        let streamGData = {};
        if (stream.global) {
          const text = await readFile(stream.global);
          if (streamType === 'pct') {
            const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
            const hdrs = splitCSVLine(lines[0]);
            const dateIdx = findHeader(hdrs, ['Date', 'Reporting Date', 'Day']);
            if (dateIdx !== -1) {
              let maxDate = null;
              lines.slice(1).forEach(l => { const cols = splitCSVLine(l); const d = robustParseDate(cols[dateIdx]); if (d && (!maxDate || d > maxDate)) maxDate = d; });
              detectedGlobalDate = maxDate;
              setLatestGlobalDate(maxDate);
            }
          }
          streamGData = parseCSVData(text, {}, metaLookup, ['Country', 'Market', 'Campaign'], isAbs);
        }
        const mHubParsed = {};
        for (const m of MARKET_SEGMENTS) { if (stream.countryHB[m]) { const text = await readFile(stream.countryHB[m]); mHubParsed[m] = parseCSVData(text, {}, metaLookup, undefined, isAbs); } }
        const alwaysOnParsed = {};
        for (const cat of AO_CATEGORIES) { if (stream.alwaysOn[cat]) { const text = await readFile(stream.alwaysOn[cat]); alwaysOnParsed[cat] = parseCSVData(text, {}, metaLookup, undefined, isAbs); } }
        return { streamGData, mHubParsed, alwaysOnParsed };
      };

      const pctResults = await processStream('pct', false);
      const absResults = await processStream('abs', true);

      const mergeResults = (pctMap, absMap) => {
        const merged = { ...pctMap };
        Object.keys(absMap).forEach(key => {
          if (!merged[key]) merged[key] = absMap[key];
          else {
            M_TYPES.forEach(m => { GENDERS_KEYS.forEach(g => { AGE_BUCKETS.forEach(a => { merged[key].metrics[m][g][a].abs = absMap[key].metrics[m][g][a].abs; }); }); });
          }
        });
        return merged;
      };

      const mergedGlobal = mergeResults(pctResults.streamGData, absResults.streamGData);
      routeData(mergedGlobal, 'APAC');

      const regionalMerged = {};
      MARKET_SEGMENTS.forEach(m => {
        const mMerged = mergeResults(pctResults.mHubParsed[m] || {}, absResults.mHubParsed[m] || {});
        regionalMerged[m] = Object.values(mMerged);
        routeData(mMerged, m);
      });

      AO_CATEGORIES.forEach((cat) => {
        const mergedAO = mergeResults(pctResults.alwaysOnParsed[cat] || {}, absResults.alwaysOnParsed[cat] || {});
        routeData(mergedAO, 'India', 'AlwaysOn', cat);
      });

      const finalStructData = {};
      Object.keys(structDataTemp).forEach(tab => {
        finalStructData[tab] = {};
        Object.keys(structDataTemp[tab]).forEach(mk => {
          finalStructData[tab][mk] = {};
          Object.keys(structDataTemp[tab][mk]).forEach(sub => {
            finalStructData[tab][mk][sub] = {};
            Object.keys(structDataTemp[tab][mk][sub]).forEach(ss => { finalStructData[tab][mk][sub][ss] = Object.values(structDataTemp[tab][mk][sub][ss]); });
          });
        });
      });

      const globalDataArr = Object.values(mergedGlobal);
      setGlobalData(globalDataArr);
      setRegionalData(regionalMerged);
      setCampaignHubData(finalStructData);
      setIsAnalyzed(true);

      // Auto-save snapshot to memory
      const weekId = getWeekId(detectedGlobalDate || undefined);
      setMemoryStatus('saving');
      try {
        // Collect raw files for storage
        const rawFiles = {};
        const uFiles = uploadedFiles;
        if (uFiles.pct.global) rawFiles['pct-global'] = uFiles.pct.global;
        for (const [m, f] of Object.entries(uFiles.pct.countryHB)) { if (f) rawFiles[`pct-market-${m}`] = f; }
        for (const [c, f] of Object.entries(uFiles.pct.alwaysOn)) { if (f) rawFiles[`pct-ao-${c}`] = f; }
        if (uFiles.abs.global) rawFiles['abs-global'] = uFiles.abs.global;
        for (const [m, f] of Object.entries(uFiles.abs.countryHB)) { if (f) rawFiles[`abs-market-${m}`] = f; }
        for (const [c, f] of Object.entries(uFiles.abs.alwaysOn)) { if (f) rawFiles[`abs-ao-${c}`] = f; }
        if (uFiles.shared.campaignInfo) rawFiles['shared-meta'] = uFiles.shared.campaignInfo;
        if (uFiles.shared.pauseRelive) rawFiles['shared-instructions'] = uFiles.shared.pauseRelive;

        await saveSnapshot({
          weekId,
          reportingDate: detectedGlobalDate,
          rawFiles
        });
        setMemoryStatus('saved');

        // Refresh memory index
        const idx = await loadSnapshotIndex(new Date().getFullYear());
        setMemoryIndex(idx.snapshots || []);
      } catch (memErr) {
        console.error('Memory save failed:', memErr);
        setMemoryStatus('error');
      }
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  // Load memory index on mount
  useEffect(() => {
    loadSnapshotIndex(new Date().getFullYear())
      .then(idx => setMemoryIndex(idx.snapshots || []))
      .catch(() => {});
  }, []);

  // Load a historical snapshot: download raw CSVs and re-parse them
  const loadHistoricalWeek = useCallback(async (weekId) => {
    setIsLoadingMemory(true);
    try {
      const csvFiles = await loadSnapshotFiles(weekId);
      if (!csvFiles || Object.keys(csvFiles).length === 0) {
        console.error('No CSV files found for', weekId);
        return;
      }

      // Build metadata lookup from shared-meta CSV
      let metaLookup = {};
      if (csvFiles['shared-meta']) {
        const lines = csvFiles['shared-meta'].split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const hdrs = splitCSVLine(lines[0]);
          const cIdx = findHeader(hdrs, ['Campaign', 'Campaign Name']);
          const mktIdx = findHeader(hdrs, ['Market', 'Country']);
          const tabIdx = findHeader(hdrs, ['Campaign Tabs', 'Tabs', 'Tab']);
          const subIdx = findHeader(hdrs, ['Sub Tab', 'SubTab', 'Sub-Tab']);
          const ssIdx = findHeader(hdrs, ['Sub Sub Tab', 'SubSubTab', 'Sub-Sub-Tab']);
          const startIdx = findHeader(hdrs, ['Campaign Start Date', 'Start Date']);
          const endIdx = findHeader(hdrs, ['Campaign End Date', 'End Date']);
          const optIdx = findHeader(hdrs, ['Optimisation End Date', 'Opt End Date']);

          lines.slice(1).forEach(l => {
            const cols = splitCSVLine(l);
            const camp = superClean(cols[cIdx]);
            if (!camp) return;
            metaLookup[camp] = {
              market: cleanStr(cols[mktIdx]),
              tab: cleanStr(cols[tabIdx]),
              subTab: cleanStr(cols[subIdx]),
              subSubTab: cleanStr(cols[ssIdx]),
              campaignStartDate: robustParseDate(cols[startIdx]),
              campaignEndDate: robustParseDate(cols[endIdx]),
              optimisationEndDate: robustParseDate(cols[optIdx])
            };
          });
        }
      }

      // Build instruction map from shared-instructions CSV
      const instructionMap = {};
      if (csvFiles['shared-instructions']) {
        const lines = csvFiles['shared-instructions'].split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const hdrs = splitCSVLine(lines[0]);
          const cIdx = findHeader(hdrs, ['Campaign', 'Campaign Name']);
          const aIdx = findHeader(hdrs, ['Age', 'Age Group']);
          const gIdx = findHeader(hdrs, ['Gender']);
          const iIdx = findHeader(hdrs, ['Instruction', 'Action']);
          const dIdx = findHeader(hdrs, ['Launch Date', 'Date']);

          lines.slice(1).forEach(l => {
            const cols = splitCSVLine(l);
            const campaign = superClean(cols[cIdx]);
            if (!campaign) return;
            const age = (cols[aIdx] || 'total').toLowerCase().trim().replace(/[^a-z0-9+]/g, '');
            const gender = (cols[gIdx] || 'total').toLowerCase().trim();
            const instr = (cols[iIdx] || '').toUpperCase().trim();
            const date = cleanStr(cols[dIdx]);

            if (!instructionMap[campaign]) instructionMap[campaign] = {};
            if (!instructionMap[campaign][gender]) instructionMap[campaign][gender] = {};
            instructionMap[campaign][gender][age] = { instruction: instr, launchDate: date };
          });
        }
      }

      // Route data into campaign hub structure
      const structDataTemp = {};
      const routeData = (parsedMap, defaultMarket, forceTab = null, forceSub = null) => {
        Object.values(parsedMap).forEach(row => {
          const meta = row.meta || {};
          let rawTab = forceTab || cleanStr(meta.tab) || 'Uncategorized';
          const matchedChild = CAMPAIGN_CHILDREN.find(child => eq(child.id, rawTab) || eq(child.label, rawTab));
          const tabKey = matchedChild ? matchedChild.id : rawTab;
          const sub = forceSub || cleanStr(meta.subTab) || 'Generic';
          const ssVal = cleanStr(meta.subSubTab) || 'Default';
          const mk = meta.market || defaultMarket;
          const campKey = superClean(row.country);

          // Apply pause/relive instructions
          const campInstr = instructionMap[superClean(row.country)];
          if (campInstr) {
            M_TYPES.forEach(m => {
              GENDERS_KEYS.forEach(g => {
                AGE_BUCKETS.forEach(a => {
                  const sanA = a.replace(/[^a-z0-9+]/g, '');
                  const parentA = (sanA === '1824' || sanA === '2534') ? '1834' : null;
                  const checkKeys = [
                    [g, sanA], parentA ? [g, parentA] : null, [g, 'total'],
                    ['total', sanA], parentA ? ['total', parentA] : null, ['total', 'total']
                  ].filter(Boolean);
                  let activeDemInstr = null;
                  for (const [tg, ta] of checkKeys) {
                    const found = campInstr[tg]?.[ta];
                    if (found && found.instruction === 'PAUSE' && found.launchDate && found.launchDate.trim() !== '') {
                      activeDemInstr = found;
                      break;
                    }
                  }
                  if (activeDemInstr) {
                    row.metrics[m][g][a].isPaused = true;
                    row.metrics[m][g][a].launchDate = activeDemInstr.launchDate;
                  }
                });
              });
            });
          }

          if (!structDataTemp[tabKey]) structDataTemp[tabKey] = {};
          if (!structDataTemp[tabKey][mk]) structDataTemp[tabKey][mk] = {};
          if (!structDataTemp[tabKey][mk][sub]) structDataTemp[tabKey][mk][sub] = {};
          if (!structDataTemp[tabKey][mk][sub][ssVal]) structDataTemp[tabKey][mk][sub][ssVal] = {};
          structDataTemp[tabKey][mk][sub][ssVal][campKey] = row;
        });
      };

      // Parse percentage and absolute streams
      const mergeResults = (pctMap, absMap) => {
        const merged = { ...pctMap };
        Object.keys(absMap).forEach(key => {
          if (!merged[key]) merged[key] = absMap[key];
          else {
            M_TYPES.forEach(m => { GENDERS_KEYS.forEach(g => { AGE_BUCKETS.forEach(a => { merged[key].metrics[m][g][a].abs = absMap[key].metrics[m][g][a].abs; }); }); });
          }
        });
        return merged;
      };

      // Parse global streams
      const pctGlobal = csvFiles['pct-global'] ? parseCSVData(csvFiles['pct-global'], {}, metaLookup, ['Country', 'Market', 'Campaign'], false) : {};
      const absGlobal = csvFiles['abs-global'] ? parseCSVData(csvFiles['abs-global'], {}, metaLookup, ['Country', 'Market', 'Campaign'], true) : {};
      const mergedGlobal = mergeResults(pctGlobal, absGlobal);
      routeData(mergedGlobal, 'APAC');

      // Detect reporting date from pct-global
      let loadedDate = null;
      if (csvFiles['pct-global']) {
        const lines = csvFiles['pct-global'].split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length > 1) {
          const hdrs = splitCSVLine(lines[0]);
          const dateIdx = findHeader(hdrs, ['Date', 'Reporting Date', 'Day']);
          if (dateIdx !== -1) {
            lines.slice(1).forEach(l => { const cols = splitCSVLine(l); const d = robustParseDate(cols[dateIdx]); if (d && (!loadedDate || d > loadedDate)) loadedDate = d; });
          }
        }
      }

      // Parse market streams
      const regionalMerged = {};
      MARKET_SEGMENTS.forEach(m => {
        const pctMarket = csvFiles[`pct-market-${m}`] ? parseCSVData(csvFiles[`pct-market-${m}`], {}, metaLookup, undefined, false) : {};
        const absMarket = csvFiles[`abs-market-${m}`] ? parseCSVData(csvFiles[`abs-market-${m}`], {}, metaLookup, undefined, true) : {};
        const mMerged = mergeResults(pctMarket, absMarket);
        regionalMerged[m] = Object.values(mMerged);
        routeData(mMerged, m);
      });

      // Parse always-on streams
      AO_CATEGORIES.forEach(cat => {
        const pctAO = csvFiles[`pct-ao-${cat}`] ? parseCSVData(csvFiles[`pct-ao-${cat}`], {}, metaLookup, undefined, false) : {};
        const absAO = csvFiles[`abs-ao-${cat}`] ? parseCSVData(csvFiles[`abs-ao-${cat}`], {}, metaLookup, undefined, true) : {};
        const mergedAO = mergeResults(pctAO, absAO);
        routeData(mergedAO, 'India', 'AlwaysOn', cat);
      });

      // Build final campaign hub structure
      const finalStructData = {};
      Object.keys(structDataTemp).forEach(tab => {
        finalStructData[tab] = {};
        Object.keys(structDataTemp[tab]).forEach(mk => {
          finalStructData[tab][mk] = {};
          Object.keys(structDataTemp[tab][mk]).forEach(sub => {
            finalStructData[tab][mk][sub] = {};
            Object.keys(structDataTemp[tab][mk][sub]).forEach(ss => { finalStructData[tab][mk][sub][ss] = Object.values(structDataTemp[tab][mk][sub][ss]); });
          });
        });
      });

      // Set all state
      setGlobalData(Object.values(mergedGlobal));
      setRegionalData(regionalMerged);
      setCampaignHubData(finalStructData);
      setLatestGlobalDate(loadedDate);
      setIsAnalyzed(true);
      setActiveTab('OKR');

      setHistoricalSnapshots(prev => {
        if (prev.find(s => s.weekId === weekId)) return prev;
        return [...prev, { weekId }];
      });
    } catch (err) {
      console.error('Failed to load snapshot:', err);
    } finally {
      setIsLoadingMemory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab && campaignHubData[activeTab]) {
      const activeMarket = tabMarketFilter[activeTab] || 'India';
      const subs = getSubTabs(activeTab, activeMarket);
      if (subs.length > 0) {
        const currentSub = subTabFilter[activeTab];
        const nextSub = subs.includes(currentSub) ? currentSub : subs[0];
        if (currentSub !== nextSub) setSubTabFilter(p => ({...p, [activeTab]: nextSub}));
        const subSubs = getSubSubTabs(activeTab, activeMarket, nextSub);
        if (subSubs.length > 0) {
          const currentSS = subSubTabFilter[activeTab];
          const nextSS = subSubs.includes(currentSS) ? currentSS : subSubs[0];
          if (currentSS !== nextSS) setSubSubTabFilter(p => ({...p, [activeTab]: nextSS}));
        } else setSubSubTabFilter(p => ({...p, [activeTab]: 'Default'}));
      } else {
        setSubTabFilter(p => ({...p, [activeTab]: 'Generic'}));
        setSubSubTabFilter(p => ({...p, [activeTab]: 'Default'}));
      }
    }
  }, [activeTab, tabMarketFilter, campaignHubData, getSubTabs, getSubSubTabs, subTabFilter, subSubTabFilter]);

  const handleFileUpload = (stream, type, f, k) => {
    setUploadedFiles(prev => {
      const isMulti = type === 'countryHB' || type === 'alwaysOn';
      const updatedStream = { ...prev[stream] };
      if (isMulti) updatedStream[type] = { ...updatedStream[type], [k]: f };
      else updatedStream[type] = f;
      return { ...prev, [stream]: updatedStream };
    });
  };

  if (!isAnalyzed) return <LandingPage uploadedFiles={uploadedFiles} handleFileUpload={handleFileUpload} startAnalysis={startAnalysis} isAnalyzing={isAnalyzing} memoryIndex={memoryIndex} loadHistoricalWeek={loadHistoricalWeek} isLoadingMemory={isLoadingMemory} historicalSnapshots={historicalSnapshots} />;

  return (
    <div className="flex h-screen bg-black text-[#e0e0e0] overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 bg-[#1a1a1a] border-r border-[#3a3a3a] flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3 mb-6 shrink-0 border-b border-[#3a3a3a]">
          <div className="bg-[#FF0000] p-2 rounded-lg flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
          {isSidebarOpen && <div><h2 className="text-lg font-bold tracking-tight">BRAIN <span className="text-[#FF0000]">2.0</span></h2><p className="text-[8px] font-bold uppercase text-[#808080] tracking-widest">APAC Shorts</p></div>}
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { if (item.id === 'Upload') setIsAnalyzed(false); else setActiveTab(item.id); }} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group relative cursor-pointer ${activeTab === item.id ? 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20' : 'text-[#808080] hover:bg-white/5 hover:text-white border border-transparent'}`}>
              <item.icon className="w-5 h-5 shrink-0" />{isSidebarOpen && <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
          <button onClick={() => setIsCampaignTypeExpanded(!isCampaignTypeExpanded)} className="w-full flex items-center justify-between p-3 rounded-lg text-[#808080] hover:text-white cursor-pointer border border-transparent">
            <div className="flex items-center gap-3"><FolderKanban className="w-5 h-5 shrink-0" />{isSidebarOpen && <span className="text-[11px] font-bold uppercase tracking-wider">Campaign Deepdive</span>}</div>
            {isSidebarOpen && (isCampaignTypeExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
          </button>
          {isCampaignTypeExpanded && isSidebarOpen && (
            <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
              {CAMPAIGN_CHILDREN.map(child => (
                <button key={child.id} onClick={() => setActiveTab(child.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${activeTab === child.id ? 'bg-[#FF0000]/10 text-[#FF0000]' : 'text-[#555] hover:bg-white/5 hover:text-white'}`}>
                  <child.icon className="w-4 h-4 shrink-0" /><span className="text-[10px] font-bold uppercase">{child.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Memory Panel */}
          {isSidebarOpen && (
            <div className="mt-6 pt-4 border-t border-[#3a3a3a]">
              <div className="flex items-center gap-2 px-3 mb-3">
                <Database className="w-4 h-4 text-[#808080]" />
                <span className="text-[10px] font-bold uppercase text-[#808080] tracking-wider">Memory</span>
                {memoryStatus === 'saving' && <Loader2 className="w-3 h-3 text-amber-400 animate-spin ml-auto" />}
                {memoryStatus === 'saved' && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />}
                {memoryStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-400 ml-auto" />}
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto px-1">
                {memoryIndex.length === 0 ? (
                  <p className="text-[9px] text-[#555] px-3 py-2">No snapshots stored yet</p>
                ) : (
                  memoryIndex.map(snap => (
                    <button
                      key={snap.weekId}
                      onClick={() => loadHistoricalWeek(snap.weekId)}
                      disabled={isLoadingMemory}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all cursor-pointer ${
                        historicalSnapshots.some(h => h.weekId === snap.weekId)
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-[#808080] hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold block">{snap.weekId}</span>
                        <span className="text-[8px] opacity-60">{snap.reportingDate || 'No date'}</span>
                      </div>
                      <span className="text-[8px] opacity-50">{snap.globalCount || 0}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-8 py-5 border-b border-[#3a3a3a] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-bold text-white uppercase">{activeTab}</h4>
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase hover:bg-[#e0e0e0] transition-all"><Download className="w-4 h-4 mr-2 inline" /> Export Hub</button>
        </header>

        <main className="flex-1 overflow-auto p-10 relative">
          {activeTab === 'OKR' && <OKRAndRecsView globalData={globalData} regionalData={regionalData} latestDate={latestGlobalDate} />}
          {(activeTab === 'Global Hub' || activeTab === 'Market Hub') && (
            <div className="space-y-8 animate-in fade-in">
              <MetricControlHub activeMetrics={activeMetrics} toggleMetric={m => setActiveMetrics(p => p.includes(m) ? (p.length > 1 ? p.filter(x => x !== m) : p) : [...p, m])} handleAllToggle={() => setActiveMetrics(p => p.length === M_TYPES.length ? ['DAU-SCT'] : [...M_TYPES])} />
              {activeTab === 'Market Hub' && (
                <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] w-fit">
                  <MapPin className="w-6 h-6 text-red-600" />
                  <select value={activeMarketSubTab} onChange={e => setActiveMarketSubTab(e.target.value)} className="bg-transparent text-white font-bold uppercase outline-none cursor-pointer pr-4">
                    {MARKET_SEGMENTS.map(m => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                  </select>
                </div>
              )}
              <MasterTableView data={activeTab === 'Global Hub' ? globalData : (regionalData[activeMarketSubTab] || [])} activeMetrics={activeMetrics} isCampaignView={activeTab === 'Market Hub'} />
            </div>
          )}

          {(CAMPAIGN_CHILDREN.some(c => c.id === activeTab) || campaignHubData[activeTab]) && activeTab !== 'OKR' && (
            <div className="space-y-8 animate-in fade-in">
              <MetricControlHub activeMetrics={activeMetrics} toggleMetric={m => setActiveMetrics(p => p.includes(m) ? (p.length > 1 ? p.filter(x => x !== m) : p) : [...p, m])} handleAllToggle={() => setActiveMetrics(p => p.length === M_TYPES.length ? ['DAU-SCT'] : [...M_TYPES])} />
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] w-fit">
                  <MapPin className="w-6 h-6 text-red-600" />
                  <select value={tabMarketFilter[activeTab]} onChange={e => setTabMarketFilter(p => ({ ...p, [activeTab]: e.target.value }))} className="bg-transparent text-white font-bold uppercase outline-none cursor-pointer pr-4">
                    {MARKET_SEGMENTS.map(m => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                  </select>
                </div>
                {getSubTabs(activeTab, tabMarketFilter[activeTab]).length > 0 && (
                  <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg w-fit border border-[#3a3a3a] overflow-x-auto max-w-full">
                    {getSubTabs(activeTab, tabMarketFilter[activeTab]).map(s => (
                      <button key={s} onClick={() => setSubTabFilter(p => ({ ...p, [activeTab]: s }))} className={`px-5 py-2 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${subTabFilter[activeTab] === s ? 'bg-[#FF0000] text-white' : 'text-[#808080] hover:text-white'}`}>{s}</button>
                    ))}
                  </div>
                )}
                {getSubSubTabs(activeTab, tabMarketFilter[activeTab], subTabFilter[activeTab]).length > 0 && (
                  <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg w-fit border border-[#3a3a3a] overflow-x-auto max-w-full">
                    {getSubSubTabs(activeTab, tabMarketFilter[activeTab], subTabFilter[activeTab]).map(ss => (
                      <button key={ss} onClick={() => setSubSubTabFilter(p => ({ ...p, [activeTab]: ss }))} className={`px-4 py-1.5 rounded-md text-[8px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${subSubTabFilter[activeTab] === ss ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}>{ss}</button>
                    ))}
                  </div>
                )}
              </div>
              <MasterTableView
                data={(() => {
                  const mkt = tabMarketFilter[activeTab];
                  const sub = subTabFilter[activeTab] || 'Generic';
                  const ss = subSubTabFilter[activeTab] || 'Default';
                  const path = campaignHubData[activeTab]?.[mkt]?.[sub];
                  return ss === 'Default' || !ss ? (path ? Object.values(path).flat() : []) : (path?.[ss] || []);
                })()}
                activeMetrics={activeMetrics}
                isCampaignView
              />
            </div>
          )}
        </main>
      </div>
      <style>{`
        body { background-color: #000000; color: #e0e0e0; margin: 0; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 10px; }
        select { appearance: none; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E") no-repeat right 0.5rem center; background-size: 1em; padding-right: 2rem; }
      `}</style>
    </div>
  );
};

export default App;
