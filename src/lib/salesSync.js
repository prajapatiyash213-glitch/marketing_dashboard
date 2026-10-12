/**
 * Live Data Sync Service for `sales` CRM repository
 * Repo: https://github.com/prajapatiyash213-glitch/sales
 * Live App: https://sales-hazel-ten.vercel.app
 *
 * Resilient multi-tier sync:
 * 1. Primary: Local dev proxy or Vercel serverless `/api/sales-leads`
 * 2. Fallback: Live sales backend `https://sales-hazel-ten.vercel.app/api/sales-leads`
 */

const FALLBACK_ENDPOINT = "https://sales-hazel-ten.vercel.app/api/sales-leads";

function getEndpointUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/sales-leads`;
  }
  return "http://localhost:5173/api/sales-leads";
}

function sanitizeLeadPatch(patchObj) {
  const clean = { ...patchObj };
  if ('connect_date' in clean && !clean.connect_date) clean.connect_date = null;
  if ('followup2_date' in clean && !clean.followup2_date) clean.followup2_date = null;
  if ('lead_date' in clean && !clean.lead_date) clean.lead_date = new Date().toISOString().split('T')[0];
  return clean;
}

async function requestSalesApi(options = {}) {
  const primaryUrl = getEndpointUrl();

  try {
    const res = await fetch(primaryUrl, options);
    const contentType = res.headers.get("content-type") || "";

    if (res.ok && contentType.includes("application/json")) {
      return await res.json();
    }

    // If primary returned HTML (e.g. rewrite to index.html) or error, try fallback
    console.warn(`[SalesSync] Primary endpoint returned status ${res.status} (${contentType}), trying fallback...`);
    const fbRes = await fetch(FALLBACK_ENDPOINT, options);
    if (!fbRes.ok) throw new Error(`HTTP ${fbRes.status}: ${fbRes.statusText}`);
    return await fbRes.json();
  } catch (err) {
    // If primary failed on network, try fallback
    try {
      console.warn("[SalesSync] Primary fetch failed, attempting fallback:", FALLBACK_ENDPOINT);
      const fbRes = await fetch(FALLBACK_ENDPOINT, options);
      if (fbRes.ok) return await fbRes.json();
    } catch {
      // ignore fallback error and throw original or fallback error
    }
    throw err;
  }
}

export function extractCompanyFromEmail(email) {
  if (!email || !email.includes('@')) return '';
  const domain = email.split('@')[1] || '';
  const namePart = domain.split('.')[0] || '';
  if (!namePart || ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'aol', 'zoho', 'rediffmail'].includes(namePart.toLowerCase())) {
    return '';
  }
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function displayCompany(row) {
  if (row.company && row.company.trim()) return row.company.trim();
  const derived = extractCompanyFromEmail(row.email);
  return derived || '—';
}

function mapRowToLead(row, profilesMap = {}) {
  return {
    id: row.id,
    email: row.email || "",
    company: displayCompany(row),
    brand: row.brand || "Tecnoprism",
    owner: profilesMap[row.owner_id] || (row.owner_id === "5a94425d-b626-417c-a373-f9fa2ff0fdb0" ? "shashank Jha" : "Yash Prajapati"),
    owner_id: row.owner_id || "e1914945-b140-46b6-b13d-82b45f053f24",
    leadDate: row.lead_date || row.created_at?.split("T")[0] || "",
    leadSource: row.lead_source || "Inbound - Referral",
    leadStage: row.lead_stage || "Discovery",
    dateOfConnect: row.connect_date || "",
    comments: row.comments || "",
    followup2Date: row.followup2_date || "",
    followup2Comments: row.followup2_comments || "",
    leadStatus: row.lead_status || "New",
    created_at: row.created_at
  };
}

/**
 * Fetch all user profiles from API/Supabase to resolve owner_id to full names
 */
export async function fetchProfilesMap() {
  try {
    const data = await requestSalesApi({
      headers: { "Content-Type": "application/json" }
    });
    const profiles = data.profiles || [];
    const map = {};
    profiles.forEach(p => {
      if (p.id) {
        map[p.id] = p.full_name || p.email || "Yash Prajapati";
      }
    });
    return map;
  } catch (err) {
    console.warn("[SalesSync] Profiles fetch error:", err);
    return {};
  }
}

/**
 * Fetch all leads from backend
 */
export async function fetchLiveLeads(profilesMap = {}) {
  try {
    const data = await requestSalesApi({
      headers: { "Content-Type": "application/json" }
    });
    const rows = data.leads || [];

    if (data.profiles && Array.isArray(data.profiles)) {
      data.profiles.forEach(p => {
        if (p.id) profilesMap[p.id] = p.full_name || p.email || "Yash Prajapati";
      });
    }

    console.log(`[SalesSync] Successfully fetched ${rows.length} live leads.`);
    return rows.map(row => mapRowToLead(row, profilesMap));
  } catch (err) {
    console.error("[SalesSync] Live leads fetch error:", err);
    throw err;
  }
}

/**
 * Create a new lead on backend
 */
export async function createLiveLead(leadData) {
  try {
    const payload = sanitizeLeadPatch({
      email: leadData.email,
      company: leadData.company,
      brand: leadData.brand || "Tecnoprism",
      owner_id: leadData.owner_id || "e1914945-b140-46b6-b13d-82b45f053f24",
      lead_date: leadData.leadDate || new Date().toISOString().split("T")[0],
      lead_source: leadData.leadSource || "Inbound - Referral",
      lead_stage: leadData.leadStage || "Discovery",
      connect_date: leadData.dateOfConnect || null,
      comments: leadData.comments || null,
      followup2_date: leadData.followup2Date || null,
      followup2_comments: leadData.followup2Comments || null,
      lead_status: leadData.leadStatus || "New"
    });

    const data = await requestSalesApi({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return data.lead || null;
  } catch (err) {
    console.error("[SalesSync] Error creating live lead:", err);
    return null;
  }
}

/**
 * Update lead fields on backend
 */
export async function updateLiveLead(leadId, patchObj) {
  try {
    const sanitized = sanitizeLeadPatch(patchObj);
    const data = await requestSalesApi({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, patch: sanitized })
    });
    return !!data.success;
  } catch (err) {
    console.error("[SalesSync] Error updating lead on backend:", err);
    return false;
  }
}
