/**
 * Minimal IndexedDB store so a refresh does not empty the dashboard.
 * Dates survive the structured clone, so no serialisation dance is needed.
 * Disable with VITE_PERSIST=false when the machine is shared.
 */
const DB_NAME = "sales-seo-dashboard";
const STORE = "datasets";
const MASTER_KEY = "workspace_master_dataset";
const LEGACY_KEY = "current";
const ENABLED = (import.meta.env.VITE_PERSIST ?? "true") !== "false";

const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("omniscope_workspace_sync") : null;

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

export const notifyDatasetUpdate = (data) => {
  try {
    syncChannel?.postMessage({ type: "SYNC_DATASET", data });
  } catch {
    /* ignore */
  }
};

export const onDatasetUpdate = (callback) => {
  if (!syncChannel) return () => {};
  const handler = (e) => {
    if (e.data?.type === "SYNC_DATASET") callback(e.data.data);
  };
  syncChannel.addEventListener("message", handler);
  return () => syncChannel.removeEventListener("message", handler);
};

export const saveDataset = async (data) => {
  try {
    await tx("readwrite", (s) => {
      s.put(data, MASTER_KEY);
      s.put(data, LEGACY_KEY);
    });
    notifyDatasetUpdate(data);
  } catch {
    /* storage is optional */
  }
};

export const loadDataset = async () => {
  try {
    const master = await tx("readonly", (s) => s.get(MASTER_KEY));
    if (master) return master;
    return await tx("readonly", (s) => s.get(LEGACY_KEY));
  } catch {
    return null;
  }
};

export const clearDataset = async () => {
  try {
    await tx("readwrite", (s) => {
      s.delete(MASTER_KEY);
      s.delete(LEGACY_KEY);
    });
    notifyDatasetUpdate(null);
  } catch {
    /* ignore */
  }
};
