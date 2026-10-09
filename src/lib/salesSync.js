/**
 * Live Supabase Data Sync Service for `sales` CRM repository
 * Repo: https://github.com/prajapatiyash213-glitch/sales
 * Live App: https://sales-hazel-ten.vercel.app
 */

const SUPABASE_URL = "https://takqbngsfdwburtujtsc.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || atob("c2Jfc2VjcmV0X3J2RWtuazdLRkRZZC1wR0FHTDNQLVFfekw2bTkyRUY=");

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

/**
 * Fetch all user profiles from Supabase to resolve owner_id to full names
 */
export async function fetchProfilesMap() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers: HEADERS });
    if (!res.ok) return {};
    const profiles = await res.json();
    const map = {};
    profiles.forEach(p => {
      if (p.id) {
        map[p.id] = p.full_name || p.email || "Yash Prajapati";
      }
    });
    return map;
  } catch (err) {
    console.warn("Failed to fetch profiles map:", err);
    return {};
  }
}

/**
 * Fetch all leads from Supabase backend
 */
export async function fetchLiveLeads(profilesMap = {}) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    return rows.map(row => ({
      id: row.id,
      email: row.email || "",
      company: row.company || row.email?.split("@")[0] || "N/A",
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
    }));
  } catch (err) {
    console.warn("Live Supabase fetch error, falling back to local dataset:", err);
    return null;
  }
}

/**
 * Create a new lead on Supabase backend
 */
export async function createLiveLead(leadData) {
  try {
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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { ...HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Failed to create lead on Supabase:", errText);
      return null;
    }

    const inserted = await res.json();
    return inserted?.[0] || null;
  } catch (err) {
    console.error("Error creating live lead:", err);
    return null;
  }
}

/**
 * Update lead owner or status on Supabase
 */
export async function updateLiveLead(leadId, patchObj) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify(patchObj)
    });
    return res.ok;
  } catch (err) {
    console.error("Error updating lead on Supabase:", err);
    return false;
  }
}
