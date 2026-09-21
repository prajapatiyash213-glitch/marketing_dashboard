/**
 * Minimal IndexedDB store so a refresh does not empty the dashboard.
 * Dates survive the structured clone, so no serialisation dance is needed.
 * Disable with VITE_PERSIST=false when the machine is shared.
 */
const DB_NAME = "sales-seo-dashboard";
const STORE = "datasets";
const KEY = "current";
const ENABLED = (import.meta.env.VITE_PERSIST ?? "true") !== "false";

function open() {
  return new Promise((resolve, reject) => {
    if (!ENABLED || typeof indexedDB === "undefined") return reject(new Error("unavailable"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req?.result ?? null); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
};

export const saveDataset = async (data) => {
  try { await tx("readwrite", (s) => s.put(data, KEY)); } catch { /* storage is optional */ }
};

export const loadDataset = async () => {
  try { return await tx("readonly", (s) => s.get(KEY)); } catch { return null; }
};

export const clearDataset = async () => {
  try { await tx("readwrite", (s) => s.delete(KEY)); } catch { /* ignore */ }
};
