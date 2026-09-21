import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { mergeSeoWeeks, sanitizeSeoWeeks } from "../lib/seoMatrix.js";
import { MAX_FILE_BYTES } from "../lib/parseWorkbook.js";
import { saveDataset, loadDataset, clearDataset } from "../lib/storage.js";
import { buildSampleData } from "../lib/sampleData.js";
import { EXACT_SEO_DATA } from "../lib/exactSeoData.js";

const DataContext = createContext(null);
const ACCEPTED = /\.(xlsx|xlsm|xls|csv)$/i;

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

  // Restore the previous session once on mount.
  useEffect(() => {
    let alive = true;
    loadDataset().then((saved) => {
      if (!alive) return;
      if (saved?.leads?.length || saved?.weeks?.length) {
        setLeads(saved.leads || []);
        let cleanWeeks = sanitizeSeoWeeks(saved.weeks || []);
        const tpWeeks = cleanWeeks.filter((w) => w.site === "tecnoprism.com");
        const tpViews = tpWeeks.reduce((acc, w) => acc + (w.views || 0), 0);
        if (tpWeeks.length !== 45 || tpViews !== 64002) {
          cleanWeeks = cleanWeeks.filter((w) => w.site !== "tecnoprism.com").concat(EXACT_SEO_DATA);
        }
        setWeeks(cleanWeeks);
        setChannels(saved.channels || { email: [], social: [], landing: [], cost: [] });
        setFiles(saved.files || []);
        setIsSample(Boolean(saved.isSample));
        saveDataset({
          leads: saved.leads || [],
          weeks: cleanWeeks,
          channels: saved.channels || { email: [], social: [], landing: [], cost: [] },
          files: saved.files || [],
          isSample: Boolean(saved.isSample),
        });
      } else {
        const sample = buildSampleData();
        setLeads(sample.leads);
        setWeeks(sample.weeks);
        setChannels(sample.channels);
        setFiles(sample.files);
        setIsSample(true);
        saveDataset({ ...sample, isSample: true });
      }
      setRestored(true);
    });
    return () => { alive = false; };
  }, []);

  const persist = useCallback((next) => { saveDataset(next); }, []);

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
    () => ({ leads, weeks, channels, files, rawSheets, isSample, busy, problems, restored, importFiles, loadSample, loadExactSeo, clearAll, dismissProblems: () => setProblems([]) }),
    [leads, weeks, channels, files, rawSheets, isSample, busy, problems, restored, importFiles, loadSample, loadExactSeo, clearAll]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
