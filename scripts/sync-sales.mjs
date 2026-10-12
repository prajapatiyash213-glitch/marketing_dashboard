/**
 * Server-side Sync Service for `sales` CRM database (Supabase)
 * Used by Vite dev middleware and Vercel serverless functions.
 * Avoids browser-side "Forbidden use of secret API key in browser" 401 error.
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
  if ('connect_date' in clean && !clean.connect_date) {
    clean.connect_date = null;
  }
  if ('followup2_date' in clean && !clean.followup2_date) {
    clean.followup2_date = null;
  }
  if ('lead_date' in clean && !clean.lead_date) {
    clean.lead_date = new Date().toISOString().split('T')[0];
  }
  if ('comments' in clean && clean.comments === undefined) {
    clean.comments = null;
  }
  if ('followup2_comments' in clean && clean.followup2_comments === undefined) {
    clean.followup2_comments = null;
  }
  return clean;
}

export async function getSalesData() {
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

  return { profiles, leads };
}

export async function createSalesLead(payload) {
  const sanitized = sanitizeLeadFields(payload);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "return=representation" },
    body: JSON.stringify(sanitized)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create lead: ${err}`);
  }

  const inserted = await res.json();
  return inserted?.[0] || null;
}

export async function updateSalesLead(id, patch) {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid UUID id '${id}' provided for update.`);
  }

  const sanitized = sanitizeLeadFields(patch);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=representation" },
    body: JSON.stringify(sanitized)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update lead: ${err}`);
  }

  const updated = await res.json();
  return { success: true, lead: updated?.[0] || null };
}
