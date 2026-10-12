/**
 * Vercel Serverless Function / Next.js Server Handler for `/api/sales-leads`
 */
import { getSalesData, createSalesLead, updateSalesLead } from "../scripts/sync-sales.mjs";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === "GET") {
      const data = await getSalesData();
      res.statusCode = 200;
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch {}
      }
      const created = await createSalesLead(body);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, lead: created }));
      return;
    }

    if (req.method === "PATCH") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch {}
      }
      const { id, patch } = body || {};
      if (!id || !patch) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing id or patch" }));
        return;
      }
      const result = await updateSalesLead(id, patch);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (err) {
    console.error("[Sales Leads API Error]:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || "Server Error" }));
  }
}
