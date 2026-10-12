/**
 * Live Data Sync Service for `sales` CRM repository
 * Repo: https://github.com/prajapatiyash213-glitch/sales
 * Live App: https://sales-hazel-ten.vercel.app
 *
 * Uses `/api/sales-leads` proxy to avoid browser-side 401 "Forbidden use of secret API key in browser"
 */

function getEndpointUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/sales-leads`;
  }
  return "http://localhost:5173/api/sales-leads";
}

function mapRowToLead(row, profilesMap = {}) {
  // If company is empty, extract from email or domain
  let comp = row.company?.trim();
  if (!comp && row.email) {
    const domainPart = row.email.split("@")[1]?.split(".")[0];
    comp = domainPart ? domainPart.charAt(0).toUpperCase() + domainPart.slice(1) : "N/A";
  }

  return {
    id: row.id,
    email: row.email || "",
    company: comp || "N/A",
    brand: row.brand || "Tecnoprism",
    owner: profilesMap[row.owner_id] || "Yash Prajapati",
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
    const endpoint = getEndpointUrl();
    const res = await fetch(endpoint, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { profiles } = await res.json();
    const map = {};
    (profiles || []).forEach(p => {
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
    const endpoint = getEndpointUrl();
    console.log("[SalesSync] Fetching leads from:", endpoint);
    const res = await fetch(endpoint, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    const rows = data.leads || [];

    // Also update profiles if provided in response
    if (data.profiles && Array.isArray(data.profiles)) {
      data.profiles.forEach(p => {
        if (p.id) profilesMap[p.id] = p.full_name || p.email || "Yash Prajapati";
      });
    }

    console.log(`[SalesSync] Successfully fetched ${rows.length} leads.`);
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
    const endpoint = getEndpointUrl();
    const payload = {
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
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create lead: ${errText}`);
    }

    const data = await res.json();
    return data.lead || null;
  } catch (err) {
    console.error("[SalesSync] Error creating live lead:", err);
    return null;
  }
}

/**
 * Update lead owner or status on backend
 */
export async function updateLiveLead(leadId, patchObj) {
  try {
    const endpoint = getEndpointUrl();
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, patch: patchObj })
    });
    return res.ok;
  } catch (err) {
    console.error("[SalesSync] Error updating lead on backend:", err);
    return false;
  }
}
