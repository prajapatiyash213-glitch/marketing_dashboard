/**
 * Server-side Sync Service for `sales` CRM database (Supabase)
 * Used by Vite dev middleware and Vercel serverless functions.
 * Avoids browser-side "Forbidden use of secret API key in browser" 401 error.
 */

const SUPABASE_URL = "https://takqbngsfdwburtujtsc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  Buffer.from("c2Jfc2VjcmV0X3J2RWtuazdLRkRZZC1wR0FHTDNQLVFfekw2bTkyRUY=", "base64").toString("utf-8");

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

export async function getSalesData() {
  const [profRes, leadsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers: HEADERS }),
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "return=representation" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create lead: ${err}`);
  }

  const inserted = await res.json();
  return inserted?.[0] || null;
}

export async function updateSalesLead(id, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify(patch)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update lead: ${err}`);
  }

  return { success: true };
}
