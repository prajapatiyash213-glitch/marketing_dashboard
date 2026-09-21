/**
 * Workbook parsing runs here so a 40 MB file cannot freeze the interface.
 * The main thread posts { id, name, buffer } and gets back a result or an error.
 */
import { parseWorkbook } from "../lib/parseWorkbook.js";

self.onmessage = (event) => {
  const { id, name, buffer } = event.data;
  try {
    const result = parseWorkbook(buffer, name);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, name, error: error?.message || "Unknown parsing error" });
  }
};
