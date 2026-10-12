/**
 * Vercel Serverless Function Handler for `/api/sales-leads`
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://takqbngsfdwburtujtsc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  Buffer.from("c2Jfc2VjcmV0X3J2RWtuazdLRkRZZC1wR0FHTDNQLVFfekw2bTkyRUY=", "base64").toString("utf-8");

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeLeadFields(data) {
  const clean = { ...data };
  if ('connect_date' in clean && !clean.connect_date) clean.connect_date = null;
  if ('followup2_date' in clean && !clean.followup2_date) clean.followup2_date = null;
  if ('lead_date' in clean && !clean.lead_date) clean.lead_date = new Date().toISOString().split('T')[0];
  if ('comments' in clean && clean.comments === undefined) clean.comments = null;
  if ('followup2_comments' in clean && clean.followup2_comments === undefined) clean.followup2_comments = null;
  return clean;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === "GET") {
      const [profRes, leadsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,role`, { headers: HEADERS }),
        fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, { headers: HEADERS })
      ]);

      if (!profRes.ok) {
        const err = await profRes.text();
        throw new Error(`Failed to fetch profiles: ${err}`);
      }
      if (!leadsRes.ok) {
        const err = await leadsRes.text();
        throw new Error(`Failed to fetch leads: ${err}`);
      }

      const profiles = await profRes.json();
      const leads = await leadsRes.json();

      res.statusCode = 200;
      res.end(JSON.stringify({ profiles, leads }));
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    } else if (!body && typeof req.on === "function") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try { body = JSON.parse(raw); } catch {}
    }

    if (req.method === "POST") {
      const sanitized = sanitizeLeadFields(body || {});
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: { ...HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify(sanitized)
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Failed to create lead: ${err}`);
      }

      const inserted = await resp.json();
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, lead: inserted?.[0] || null }));
      return;
    }

    if (req.method === "PATCH") {
      const { id, patch } = body || {};
      if (!id || !patch) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing id or patch" }));
        return;
      }
      if (!UUID_REGEX.test(id)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: `Invalid UUID: ${id}` }));
        return;
      }

      const sanitized = sanitizeLeadFields(patch);
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify(sanitized)
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Failed to update lead: ${err}`);
      }

      const updated = await resp.json();
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, lead: updated?.[0] || null }));
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
