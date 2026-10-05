import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { mergeSeoWeeks, sanitizeSeoWeeks } from "../lib/seoMatrix.js";
import { MAX_FILE_BYTES, deduplicateLeads } from "../lib/parseWorkbook.js";
import { saveDataset, loadDataset, clearDataset, onDatasetUpdate } from "../lib/storage.js";
import { buildSampleData } from "../lib/sampleData.js";
import { EXACT_SEO_DATA } from "./../lib/exactSeoData.js";

import { prettyDate } from "../lib/dates.js";

const DataContext = createContext(null);
const ACCEPTED = /\.(xlsx|xlsm|xls|csv)$/i;

const MASTER_DATASET_VERSION = "2026-10-05-v27-dropoffs-update";

function sanitizeLead(l) {
  if (!l) return l;
  const currentYear = new Date().getUTCFullYear();
  const isWebsiteVisitors = /website\s*visitors/i.test(l.file || "") || /website\s*visitors/i.test(l.sheet || "");
  const isWebsiteTabNoYear = /leads?\s*sheet/i.test(l.file || "") && /website/i.test(l.sheet || "") && l.hasYear === false;
  const hasNoExplicitYear = l.hasYear === false || isWebsiteVisitors || isWebsiteTabNoYear;

  let date = l.date;
  let dateText = l.dateText;

  if (hasNoExplicitYear) {
    const cleanDateText = date
      ? prettyDate(date, { withYear: false })
      : (dateText ? dateText.replace(/\s+\b(?:19|20)\d{2}\b/g, "").trim() : "");
    return {
      ...l,
      hasYear: false,
      dateText: cleanDateText,
    };
  }

  // Normalize future year typos (e.g. 2027 in Pinali sheet -> current year 2026)
  if (date && date.getUTCFullYear() > currentYear) {
    date = new Date(Date.UTC(currentYear, date.getUTCMonth(), date.getUTCDate()));
    dateText = prettyDate(date, { withYear: true });
    return {
      ...l,
      date,
      dateText,
    };
  }
  if (dateText && /\b202[7-9]\b/.test(dateText)) {
    dateText = dateText.replace(/\b202[7-9]\b/, String(currentYear));
    return {
      ...l,
      dateText,
    };
  }

  return l;
}

const MASTER_FILES = [
  "/master/Imagine 26 - Leads Database (1).xlsx",
  "/master/Key Metrics of Marketing(Tecnoprism).csv",
  "/master/KPI _ Automation COE (2).xlsx",
  "/master/Bulk Email Marketing statistics - 21 Sep 26.csv",
  "/master/Tools_And_Costs_Cleaned.xlsx",
  "/master/Leads Sheet.xlsx",
  "/master/CFO_Event_Live_Lead_Sheet_CEO_Final_Mapped.xlsx",
  "/master/Website Visitors Leads Sheet.xlsx",
  "/master/Website Visitors Leads Sheet(Drop-offs).csv",
  "/master/tecnoprism_content_30D_1790061710570.xls",
  "/master/tecnoprism_followers_1790061783804.xls"
];

export function DataProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [channels, setChannels] = useState({ email: [], social: [], landing: [], cost: [], dropoffs: [] });
  const [liveLinkedIn, setLiveLinkedIn] = useState(null);
  const [files, setFiles] = useState([]);
  const [rawSheets, setRawSheets] = useState({});
  const [isSample, setIsSample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const [restored, setRestored] = useState(false);

  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);
  const [syncingGoogleSheet, setSyncingGoogleSheet] = useState(false);
  const [googleSheetMeta, setGoogleSheetMeta] = useState(null);

  const syncLiveLinkedIn = useCallback(async () => {
    setSyncingLinkedIn(true);
    try {
      const res = await fetch("/api/sync-linkedin", { method: "POST" }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.followers) {
          setLiveLinkedIn(json);
          return json;
        }
      }
      const snapRes = await fetch(`/master/linkedin_live.json?t=${Date.now()}`);
      if (snapRes.ok) {
        const snap = await snapRes.json();
        if (snap) {
          setLiveLinkedIn(snap);
          return snap;
        }
      }
      return null;
    } catch (e) {
      console.error("Live sync failed", e);
      return null;
    } finally {
      setSyncingLinkedIn(false);
    }
  }, []);

  useEffect(() => {
    syncLiveLinkedIn();
  }, [syncLiveLinkedIn]);

  const workerRef = useRef(null);
  const pending = useRef(new Map());

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../workers/parse.worker.js", import.meta.url), { type: "module" });
      workerRef.current.onmessage = (e) => {
        const { id } = e.data;
        const resolve = pending.current.get(id);
        if (resolve) { pending.current.delete(id); resolve(e.data); }
      };
      workerRef.current.onerror = () => {
        pending.current.forEach((resolve) => resolve({ ok: false, error: "The parser stopped unexpectedly." }));
        pending.current.clear();
      };
    }
    return workerRef.current;
  }, []);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const persist = useCallback((next) => { saveDataset({ ...next, masterVersion: MASTER_DATASET_VERSION }); }, []);

  // Live real-time sync across tabs and sessions
  useEffect(() => {
    return onDatasetUpdate((data) => {
      if (!data) {
        setLeads([]);
        setWeeks([]);
        setChannels({ email: [], social: [], landing: [], cost: [], dropoffs: [] });
        setFiles([]);
        setRawSheets({});
        return;
      }
      if (data.leads) setLeads(data.leads.map(sanitizeLead));
      if (data.weeks) setWeeks(sanitizeSeoWeeks(data.weeks));
      if (data.channels) setChannels(data.channels);
      if (data.files) setFiles(data.files);
      setIsSample(false);
    });
  }, []);

  const importFiles = useCallback(async (fileList) => {
    const incoming = Array.from(fileList || []);
    const usable = incoming.filter((f) => ACCEPTED.test(f.name));
    const rejected = incoming.filter((f) => !ACCEPTED.test(f.name));
    const nextProblems = rejected.map((f) => `${f.name}: only .xlsx, .xlsm, .xls and .csv files can be read.`);

    if (!usable.length) { setProblems(nextProblems.length ? nextProblems : ["No readable spreadsheet files were dropped."]); return; }

    setBusy(true);
    const worker = getWorker();
    const results = [];

    for (const file of usable) {
      if (file.size > MAX_FILE_BYTES) {
        nextProblems.push(`${file.name}: larger than ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB, so it was skipped.`);
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        const message = await new Promise((resolve) => {
          pending.current.set(id, resolve);
          worker.postMessage({ id, name: file.name, buffer }, [buffer]);
        });
        if (!message.ok) { nextProblems.push(`${file.name}: ${message.error}`); continue; }
        const { result } = message;
        if (!result.leads.length && !result.seoWeeks.length && !result.file.channelCount) {
          nextProblems.push(`${file.name}: nothing recognised — no lead columns, weekly metric columns, or campaign columns. See the data contract on the Channels view.`);
        }
        results.push(result);
      } catch (err) {
        nextProblems.push(`${file.name}: could not be read (${err?.message || "unknown error"}).`);
      }
    }

    if (results.length) {
      const names = new Set(results.map((r) => r.file.name));
      const hasIncomingLeads = results.some((r) => r.leads && r.leads.length > 0);
      const hasIncomingSeo = results.some((r) => r.seoWeeks && r.seoWeeks.length > 0);

      setLeads((prev) => {
        if (!hasIncomingLeads && prev.length > 0) return prev.map(sanitizeLead);
        const kept = (isSample ? [] : prev).filter((l) => !names.has(l.file));
        return deduplicateLeads(kept.concat(...results.map((r) => r.leads))).map(sanitizeLead);
      });
      setWeeks((prev) => {
        if (!hasIncomingSeo && prev.length > 0) return prev;
        const incomingSites = new Set(results.flatMap((r) => (r.seoWeeks || []).map((w) => w.site)).filter(Boolean));
        let kept = (isSample ? [] : prev).filter((w) => !names.has(w.file) && !incomingSites.has(w.site));
        for (const r of results) kept = mergeSeoWeeks(kept, r.seoWeeks);
        return sanitizeSeoWeeks(kept);
      });
      setFiles((prev) => (isSample ? [] : prev).filter((f) => !names.has(f.name)).concat(results.map((r) => r.file)));
      setChannels((prev) => {
        const next = { email: [], social: [], landing: [], cost: [], dropoffs: [] };
        for (const key of Object.keys(next)) {
          const hasIncoming = results.some((r) => r.channels?.[key]?.length > 0);
          if (!hasIncoming && prev[key]?.length > 0) {
            next[key] = prev[key];
          } else {
            const kept = isSample ? [] : (prev[key] || []).filter((r) => !names.has(r.file));
            next[key] = kept.concat(...results.map((r) => r.channels?.[key] || []));
          }
        }
        return next;
      });
      setRawSheets((prev) => {
        const next = isSample ? {} : { ...prev };
        for (const r of results) next[r.file.name] = r.rawSheets;
        return next;
      });
      setIsSample(false);
    }

    setProblems(nextProblems);
    setBusy(false);
  }, [getWorker, isSample]);

  const syncLiveGoogleSheet = useCallback(async () => {
    setSyncingGoogleSheet(true);
    try {
      const res = await fetch("/api/sync-google-sheet", { method: "POST" }).catch(() => null);
      let meta = null;
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.meta) {
          meta = json.meta;
          setGoogleSheetMeta(meta);
        }
      } else {
        const metaRes = await fetch(`/master/google_sheet_sync.json?t=${Date.now()}`).catch(() => null);
        if (metaRes && metaRes.ok) {
          meta = await metaRes.json();
          setGoogleSheetMeta(meta);
        }
      }

      // Re-fetch the updated master file so weeks in state update immediately
      const fileRes = await fetch(`/master/KPI _ Automation COE (2).xlsx?t=${Date.now()}`).catch(() => null);
      if (fileRes && fileRes.ok) {
        const blob = await fileRes.blob();
        await importFiles([new File([blob], "KPI _ Automation COE (2).xlsx")]);
      }

      return meta;
    } catch (e) {
      console.error("Google Sheet sync failed", e);
      return null;
    } finally {
      setSyncingGoogleSheet(false);
    }
  }, [importFiles]);

  useEffect(() => {
    fetch(`/master/google_sheet_sync.json?t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((m) => { if (m) setGoogleSheetMeta(m); })
      .catch(() => {});
  }, []);

  // Restore workspace master dataset or automatically upgrade existing users to latest master files:
  useEffect(() => {
    let alive = true;

    async function initDataset() {
      try {
        const saved = await loadDataset();
        if (!alive) return;

        // Check if user already has the latest 8-file master version
        const hasLatestVersion = saved && saved.masterVersion === MASTER_DATASET_VERSION;
        const channelCount = Object.values(saved?.channels || {}).reduce((n, r) => n + r.length, 0);

        if (hasLatestVersion && !saved.isSample && (saved.leads?.length || saved.weeks?.length || saved.files?.length || channelCount > 0)) {
          setLeads(deduplicateLeads((saved.leads || []).map(sanitizeLead)));
          let cleanWeeks = sanitizeSeoWeeks(saved.weeks || []);
          setWeeks(cleanWeeks);
          setChannels(saved.channels || { email: [], social: [], landing: [], cost: [], dropoffs: [] });
          setFiles(saved.files || []);
          setIsSample(false);
          setRestored(true);
          return;
        }

        // For existing users with older cache, or new users:
        // Automatically fetch and load all 8 final master files
        const loadedBlobs = [];
        for (const url of MASTER_FILES) {
          const res = await fetch(encodeURI(url)).catch(() => null);
          if (res && res.ok) {
            const blob = await res.blob();
            const fileName = decodeURIComponent(url.split("/").pop());
            loadedBlobs.push(new File([blob], fileName));
          }
        }
        if (loadedBlobs.length > 0 && alive) {
          await importFiles(loadedBlobs);
          if (alive) setRestored(true);
          return;
        }
      } catch (err) {
        console.warn("Could not auto-load master files:", err);
      }

      if (alive) {
        setLeads([]);
        setWeeks([]);
        setChannels({ email: [], social: [], landing: [], cost: [], dropoffs: [] });
        setFiles([]);
        setIsSample(false);
        setRestored(true);
      }
    }

    initDataset();
    return () => { alive = false; };
  }, [importFiles]);

  const reloadMasterDataset = useCallback(async () => {
    setBusy(true);
    try {
      const loadedBlobs = [];
      for (const url of MASTER_FILES) {
        const res = await fetch(encodeURI(url)).catch(() => null);
        if (res && res.ok) {
          const blob = await res.blob();
          const fileName = decodeURIComponent(url.split("/").pop());
          loadedBlobs.push(new File([blob], fileName));
        }
      }
      if (loadedBlobs.length > 0) {
        await importFiles(loadedBlobs);
      }
    } finally {
      setBusy(false);
    }
  }, [importFiles]);

  const loadSample = useCallback(() => {
    const sample = buildSampleData();
    setLeads(sample.leads);
    setWeeks(sample.weeks);
    setChannels(sample.channels);
    setFiles(sample.files);
    setRawSheets({});
    setIsSample(true);
    setProblems([]);
    persist({ ...sample, isSample: true });
  }, [persist]);

  const loadExactSeo = useCallback(() => {
    setWeeks(EXACT_SEO_DATA);
    setIsSample(false);
  }, []);

  const removeDuplicateLeads = useCallback(() => {
    setLeads((prev) => deduplicateLeads(prev));
  }, []);

  const clearAll = useCallback(() => {
    setLeads([]); setWeeks([]); setFiles([]); setRawSheets({});
    setChannels({ email: [], social: [], landing: [], cost: [], dropoffs: [] });
    setIsSample(false); setProblems([]);
    clearDataset();
  }, []);

  // Persist whenever the dataset settles.
  useEffect(() => {
    if (!restored) return;
    const channelCount = Object.values(channels).reduce((n, r) => n + r.length, 0);
    if (!leads.length && !weeks.length && !channelCount) return;
    persist({ leads, weeks, channels, files, isSample });
  }, [leads, weeks, channels, files, isSample, restored, persist]);

  const value = useMemo(
    () => ({
      leads,
      weeks,
      channels,
      liveLinkedIn,
      files,
      rawSheets,
      isSample,
      busy,
      problems,
      restored,
      importFiles,
      reloadMasterDataset,
      loadSample,
      loadExactSeo,
      clearAll,
      removeDuplicateLeads,
      syncLiveLinkedIn,
      syncingLinkedIn,
      syncLiveGoogleSheet,
      syncingGoogleSheet,
      googleSheetMeta,
      dismissProblems: () => setProblems([]),
    }),
    [leads, weeks, channels, liveLinkedIn, files, rawSheets, isSample, busy, problems, restored, importFiles, reloadMasterDataset, loadSample, loadExactSeo, clearAll, removeDuplicateLeads, syncLiveLinkedIn, syncingLinkedIn, syncLiveGoogleSheet, syncingGoogleSheet, googleSheetMeta]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
