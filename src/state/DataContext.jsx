import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { mergeSeoWeeks, sanitizeSeoWeeks } from "../lib/seoMatrix.js";
import { MAX_FILE_BYTES } from "../lib/parseWorkbook.js";
import { saveDataset, loadDataset, clearDataset, onDatasetUpdate } from "../lib/storage.js";
import { buildSampleData } from "../lib/sampleData.js";
import { EXACT_SEO_DATA } from "./../lib/exactSeoData.js";

const DataContext = createContext(null);
const ACCEPTED = /\.(xlsx|xlsm|xls|csv)$/i;

export const MASTER_DATASET_VERSION = "2026-09-22-v8-final";

export const MASTER_FILES = [
  "/master/Bulk Email Marketing statistics - 21 Sep 26.csv",
  "/master/Leads_Sheet.xlsx",
  "/master/KPI _ Automation COE.xlsx",
  "/master/Tecnoprism _ KPIs.xlsx",
  "/master/Tools_And_Costs_Cleaned.xlsx",
  "/master/Website Visitors Leads Sheet.xlsx",
  "/master/CFO_Event_Live_Lead_Sheet_CEO_Final_Mapped.xlsx",
  "/master/Imagine 26 - Leads Database.xlsx"
];

export function DataProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [channels, setChannels] = useState({ email: [], social: [], landing: [], cost: [] });
  const [files, setFiles] = useState([]);
  const [rawSheets, setRawSheets] = useState({});
  const [isSample, setIsSample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const [restored, setRestored] = useState(false);

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
        setChannels({ email: [], social: [], landing: [], cost: [] });
        setFiles([]);
        setRawSheets({});
        return;
      }
      if (data.leads) setLeads(data.leads);
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
        if (!hasIncomingLeads && prev.length > 0) return prev;
        const kept = (isSample ? [] : prev).filter((l) => !names.has(l.file));
        return kept.concat(...results.map((r) => r.leads));
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
        const next = { email: [], social: [], landing: [], cost: [] };
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
          setLeads(saved.leads || []);
          let cleanWeeks = sanitizeSeoWeeks(saved.weeks || []);
          setWeeks(cleanWeeks);
          setChannels(saved.channels || { email: [], social: [], landing: [], cost: [] });
          setFiles(saved.files || []);
          setIsSample(false);
          setRestored(true);
          return;
        }

        // For existing users with older cache, or new users:
        // Automatically fetch and load all 8 final master files
        const loadedBlobs = [];
        for (const url of MASTER_FILES) {
          const res = await fetch(url).catch(() => null);
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
        setChannels({ email: [], social: [], landing: [], cost: [] });
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
        const res = await fetch(url).catch(() => null);
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

  const clearAll = useCallback(() => {
    setLeads([]); setWeeks([]); setFiles([]); setRawSheets({});
    setChannels({ email: [], social: [], landing: [], cost: [] });
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
      dismissProblems: () => setProblems([]),
    }),
    [leads, weeks, channels, files, rawSheets, isSample, busy, problems, restored, importFiles, reloadMasterDataset, loadSample, loadExactSeo, clearAll]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
