import { matchColumns } from "./fieldMap.js";
import { parseDateCell, detectDayFirst } from "./dates.js";
import { parseNumber, parsePercent, parseCurrency } from "./numbers.js";

/**
 * Marketing channels beyond the pipeline: email, social, landing pages and the
 * cost of the stack. Each is just a table, so one generic parser handles all of
 * them — a schema declares the columns and which of them are required before a
 * sheet is claimed.
 *
 * These modules light up the moment a sheet with the right columns is dropped.
 * Until then the dashboard says so plainly instead of showing invented numbers.
 */

const D = (field, label, aliases) => [field, label, aliases];

export const CHANNEL_SCHEMAS = {
  email: {
    id: "email",
    label: "Email marketing",
    required: ["campaign", "sent"],
    defs: [
      D("campaign", "Campaign", ["campaign", "campaign name", "email campaign", "subject", "broadcast"]),
      D("list", "Mailing List", ["mailing list", "mailing list name", "audience", "list", "segment", "list name"]),
      D("date", "Started", ["started", "started on", "send date", "date", "start date", "sent on", "scheduled", "sent date"]),
      D("sent", "Sent", ["sent", "emails sent", "sends", "delivered to", "volume", "recipients"]),
      D("openRate", "Open Rate", ["open rate", "unique open rate", "open %"]),
      D("opens", "Unique Opens", ["unique opens", "opens", "opened", "open count"]),
      D("clickRate", "Click Rate", ["click rate", "unique click rate", "ctr", "click %"]),
      D("clicks", "Unique Clicks", ["unique clicks", "clicks", "clicked", "link clicks"]),
      D("ctor", "Click to Open Rate", ["click to open rate", "click to open", "ctor", "click-to-open rate"]),
      D("bounceRate", "Unique Bounce Rate", ["unique bounce rate", "bounce rate", "bounces rate", "bounce %"]),
      D("bounces", "Unique Bounces", ["unique bounces", "bounces", "bounce"]),
      D("complaintRate", "Complaint Rate", ["complaint rate", "complaints rate", "complaint %"]),
      D("complaints", "Unique Complaints", ["unique complaints", "complaints", "complaint"]),
      D("unsubRate", "Unsub Rate", ["unsub rate", "unsubscribe rate", "unsubscribes rate", "unsub %"]),
      D("unsubscribes", "Unique Unsubs", ["unique unsubs", "unsubscribes", "unsubs", "unique unsubscribes", "opt outs"]),
      D("leads", "Leads", ["leads", "leads generated", "conversions", "signups", "replies"]),
      D("delivered", "Delivered", ["delivered", "deliveries", "successful deliveries"]),
      D("cost", "Cost", ["cost", "spend", "campaign cost"]),
      D("utm", "UTM campaign", ["utm campaign", "utm"]),
    ],
  },
  social: {
    id: "social",
    label: "Social media",
    required: ["platform", "impressions", "followers"],
    defs: [
      D("platform", "Platform", ["platform", "channel", "network", "social network"]),
      D("date", "Date", ["date", "week", "period", "posted on", "month"]),
      D("posts", "Posts", ["posts", "post count", "published", "content pieces"]),
      D("followers", "Followers", ["followers", "audience", "fans", "subscribers", "connections"]),
      D("impressions", "Impressions", ["impressions", "reach", "views", "impressions reach"]),
      D("engagements", "Engagements", ["engagements", "engagement", "interactions", "likes comments shares"]),
      D("clicks", "Clicks", ["clicks", "link clicks", "outbound clicks"]),
      D("leads", "Leads", ["leads", "leads generated", "conversions", "enquiries"]),
      D("spend", "Spend", ["spend", "ad spend", "cost", "budget"]),
    ],
  },
  landing: {
    id: "landing",
    label: "Landing pages",
    required: ["page", "sessions"],
    defs: [
      D("page", "Page", ["page", "landing page", "url", "page path", "page url"]),
      D("site", "Website", ["site", "website", "domain", "property"]),
      D("date", "Date", ["date", "week", "month", "period"]),
      D("sessions", "Sessions", ["sessions", "visits", "users", "entrances", "sessions ga4"]),
      D("conversions", "Conversions", ["conversions", "form fills", "submissions", "leads", "goal completions"]),
      D("bounce", "Bounce rate", ["bounce rate", "bounce"]),
      D("source", "UTM source", ["utm source", "source"]),
      D("medium", "UTM medium", ["utm medium", "medium"]),
      D("campaign", "UTM campaign", ["utm campaign", "campaign"]),
    ],
  },
  cost: {
    id: "cost",
    label: "Technology & tool costs",
    required: ["tool"],
    defs: [
      D("tool", "Tool", ["tool", "tool name", "software", "vendor", "subscription", "platform name", "service"]),
      D("category", "Category", ["category", "type", "purpose", "function"]),
      D("owner", "Owner", ["owner", "team", "department", "email"]),
      D("monthlyCost", "Monthly Cost", ["monthly cost", "monthly", "cost / month", "cost per month", "monthly spend"]),
      D("cycle", "Billing cycle", ["billing cycle", "cycle", "frequency", "billing"]),
      D("seats", "Seats", ["seats", "licences", "licenses", "users"]),
      D("renewal", "Renewal", ["renewal", "renewal date", "next billing", "date", "expiry"]),
      D("costPerCycle", "Cost per Cycle", ["cost per cycle", "cost / cycle", "cycle cost", "cost", "amount", "spend", "invoice", "price"]),
      D("currency", "Currency", ["currency", "curr"]),
      D("status", "Status", ["status", "state"]),
    ],
  },
};

const MONTHLY_MULTIPLIER = { monthly: 12, month: 12, quarterly: 4, quarter: 4, annual: 1, annually: 1, yearly: 1, year: 1 };

/** Normalises any billing cycle to an annual figure so totals are comparable. */
export function annualise(amount, cycle) {
  if (!Number.isFinite(amount)) return 0;
  const key = String(cycle || "").toLowerCase().trim();
  for (const [word, mult] of Object.entries(MONTHLY_MULTIPLIER)) {
    if (key.includes(word)) return amount * mult;
  }
  return amount * 12; // unstated cycles are treated as monthly, the common case
}

const isRowEmpty = (row) => row.every((c) => c === null || c === undefined || String(c).trim() === "");

/** Finds a header row that satisfies a schema's required columns. */
function findHeader(rows, schema, depth = 10) {
  for (let r = 0; r < Math.min(rows.length, depth); r++) {
    const rawCells = rows[r] || [];
    // If any cell is super long (> 120 chars), it's a data cell (e.g. tech stack, notes, bio), not a header row
    if (rawCells.some((c) => typeof c === "string" && c.trim().length > 120)) continue;

    const header = rawCells.map((c) => (c === null || c === undefined ? "" : c));
    if (header.filter((c) => String(c).trim() !== "").length < 2) continue;
    const map = matchColumns(header, schema.defs);
    if (!schema.required.every((f) => map[f])) continue;

    // For cost sheets, require at least one cost or billing column (monthlyCost, costPerCycle)
    // to avoid claiming arbitrary lead sheets where a data cell mentions "service" or "tool".
    if (schema.id === "cost" && !map.monthlyCost && !map.costPerCycle) {
      continue;
    }
    return { headerRow: r, header, map };
  }
  return null;
}

const NUMERIC = new Set(["sent", "delivered", "opens", "clicks", "leads", "unsubscribes", "bounces", "complaints", "posts", "followers", "impressions", "engagements", "sessions", "conversions", "seats"]);
const MONEY = new Set(["cost", "spend", "amount", "monthlyCost", "costPerCycle"]);
const PERCENT = new Set(["bounce", "openRate", "clickRate", "ctor", "bounceRate", "complaintRate", "unsubRate"]);

/** Parses a sheet against one schema, or returns null if it does not fit. */
export function parseChannelSheet(rows, schema, context = {}) {
  const found = findHeader(rows, schema);
  if (!found) return null;
  const { headerRow, header, map } = found;

  const dateCol = map.date?.index;
  const dayFirst = dateCol == null
    ? { dayFirst: true, certain: false }
    : detectDayFirst(rows.slice(headerRow + 1).map((r) => (r || [])[dateCol]));

  const records = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    if (isRowEmpty(row)) continue;

    const record = { id: `${context.fileName}::${context.sheetName}::${i}`, ...context };
    let hasValue = false;

    for (const [field, info] of Object.entries(map)) {
      const raw = row[info.index];
      let value;
      if (field === "date") {
        value = parseDateCell(raw, { dayFirst: dayFirst.dayFirst });
      } else if (field === "renewal") {
        value = raw === null || raw === undefined ? "" : (raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).trim());
      } else if (NUMERIC.has(field)) {
        value = parseNumber(raw);
      } else if (MONEY.has(field)) {
        value = parseCurrency(raw);
        if (!record.currency) {
          if (String(raw).includes("$")) record.currency = "USD";
          else if (String(raw).includes("₹")) record.currency = "INR";
        }
      } else if (PERCENT.has(field)) {
        value = parsePercent(raw);
      } else {
        value = raw === null || raw === undefined ? "" : String(raw).trim();
      }
      record[field] = value;
      if (value !== null && value !== "" && value !== undefined) hasValue = true;
    }
    if (!hasValue) continue;
    if (schema.required.some((f) => record[f] === null || record[f] === "")) continue;

    records.push(withDerived(record, schema.id));
  }

  if (!records.length) return null;
  return { channel: schema.id, records, mapping: { headerRow, header: header.map(String), map, dayFirst } };
}

/** Rates are computed here once, so no view has to remember the denominator. */
function withDerived(r, channel) {
  if (channel === "email") {
    const sent = r.sent || 0;
    const bounces = r.bounces || 0;
    const delivered = r.delivered != null ? r.delivered : Math.max(0, sent - bounces);
    const opens = r.opens || 0;
    const clicks = r.clicks || 0;
    const openRate = r.openRate != null ? r.openRate : (delivered ? (opens / delivered) * 100 : 0);
    const clickRate = r.clickRate != null ? r.clickRate : (delivered ? (clicks / delivered) * 100 : (sent ? (clicks / sent) * 100 : 0));
    const ctor = r.ctor != null ? r.ctor : (opens ? (clicks / opens) * 100 : 0);
    const bounceRate = r.bounceRate != null ? r.bounceRate : (sent ? (bounces / sent) * 100 : 0);
    const complaintRate = r.complaintRate != null ? r.complaintRate : (delivered ? ((r.complaints || 0) / delivered) * 100 : 0);
    const unsubRate = r.unsubRate != null ? r.unsubRate : (delivered ? ((r.unsubscribes || 0) / delivered) * 100 : 0);

    return {
      ...r,
      delivered,
      openRate,
      clickRate,
      ctr: clickRate,
      ctor,
      bounceRate,
      complaintRate,
      unsubRate,
      clickToLead: clicks ? ((r.leads || 0) / clicks) * 100 : null,
    };
  }
  if (channel === "social") {
    return {
      ...r,
      engagementRate: r.impressions ? ((r.engagements || 0) / r.impressions) * 100 : null,
      ctr: r.impressions ? ((r.clicks || 0) / r.impressions) * 100 : null,
    };
  }
  if (channel === "landing") {
    return { ...r, conversionRate: r.sessions ? ((r.conversions || 0) / r.sessions) * 100 : null };
  }
  if (channel === "cost") {
    const monthlyCost = r.monthlyCost != null ? r.monthlyCost : (r.cycle?.toLowerCase() === "monthly" ? r.costPerCycle : null);
    const costPerCycle = r.costPerCycle != null ? r.costPerCycle : (r.cycle?.toLowerCase() === "monthly" ? monthlyCost : null);
    const amount = monthlyCost ?? costPerCycle ?? 0;
    const rawCurr = String(r.currency || "").toUpperCase();
    const currency = rawCurr === "USD" ? "USD" : (rawCurr === "INR" ? "INR" : "INR");
    const status = r.status || "Active";
    return {
      ...r,
      monthlyCost,
      costPerCycle,
      currency,
      status,
      amount,
      annual: annualise(amount, r.cycle),
    };
  }
  return r;
}

/** Tries every schema in turn. Order matters only where columns overlap. */
export function detectChannelSheet(rows, context) {
  for (const schema of Object.values(CHANNEL_SCHEMAS)) {
    const parsed = parseChannelSheet(rows, schema, context);
    if (parsed) return parsed;
  }
  return null;
}
