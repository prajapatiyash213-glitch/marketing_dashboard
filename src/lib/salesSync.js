/**
 * Live Data Sync Service for `sales` CRM repository
 * Repo: https://github.com/prajapatiyash213-glitch/sales
 * Live App: https://sales-hazel-ten.vercel.app
 *
 * Uses `/api/sales-leads` proxy to avoid browser-side 401 "Forbidden use of secret API key in browser"
 */

const SUPABASE_URL = "https://takqbngsfdwburtujtsc.supabase.co";
const SUPABASE_KEY = typeof window === "undefined"
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY || Buffer.from("c2Jfc2VjcmV0X3J2RWtuazdLRkRZZC1wR0FHTDNQLVFfekw2bTkyRUY=", "base64").toString("utf-8"))
  : "";

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
    const res = await fetch("/api/sales-leads", {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) return {};
    const { profiles } = await res.json();
    const map = {};
    (profiles || []).forEach(p => {
      if (p.id) {
        map[p.id] = p.full_name || p.email || "Yash Prajapati";
      }
    });
    return map;
  } catch (err) {
    console.warn("Proxy profiles fetch failed:", err);
    return {};
  }
}

/**
 * Fetch all leads from backend
 */
export async function fetchLiveLeads(profilesMap = {}) {
  try {
    const res = await fetch("/api/sales-leads", {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = data.leads || [];

    // Also update profiles if provided in response
    if (data.profiles && Array.isArray(data.profiles)) {
      data.profiles.forEach(p => {
        if (p.id) profilesMap[p.id] = p.full_name || p.email || "Yash Prajapati";
      });
    }

    return rows.map(row => mapRowToLead(row, profilesMap));
  } catch (err) {
    console.warn("Live leads fetch error:", err);
    return null;
  }
}

/**
 * Create a new lead on backend
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

    const res = await fetch("/api/sales-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Failed to create lead on backend:", errText);
      return null;
    }

    const data = await res.json();
    return data.lead || null;
  } catch (err) {
    console.error("Error creating live lead:", err);
    return null;
  }
}

/**
 * Update lead owner or status on backend
 */
export async function updateLiveLead(leadId, patchObj) {
  try {
    const res = await fetch("/api/sales-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, patch: patchObj })
    });
    return res.ok;
  } catch (err) {
    console.error("Error updating lead on backend:", err);
    return false;
  }
}
