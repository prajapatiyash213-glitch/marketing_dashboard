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

/** Specialized parser for LinkedIn Page Analytics exports (Content & Followers). */
export function parseLinkedInSheet(rows, context = {}) {
  if (!rows || !rows.length) return null;
  const fileName = context.fileName || "";
  const sheetName = context.sheetName || "";

  // 1. LinkedIn Content "Metrics" sheet (Daily engagement metrics)
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rawHeader = rows[r] || [];
    const headerNorm = rawHeader.map((c) => String(c || "").toLowerCase().trim());
    if (
      headerNorm.includes("impressions (total)") ||
      (headerNorm.includes("impressions (organic)") && headerNorm.includes("reactions (total)"))
    ) {
      const colMap = {};
      headerNorm.forEach((h, idx) => {
        if (h.includes("date")) colMap.date = idx;
        else if (h === "impressions (total)") colMap.impressions = idx;
        else if (h === "impressions (organic)") colMap.organicImpressions = idx;
        else if (h === "impressions (sponsored)") colMap.sponsoredImpressions = idx;
        else if (h.includes("unique impressions")) colMap.uniqueImpressions = idx;
        else if (h === "clicks (total)") colMap.clicks = idx;
        else if (h === "clicks (organic)") colMap.organicClicks = idx;
        else if (h === "reactions (total)") colMap.reactions = idx;
        else if (h === "comments (total)") colMap.comments = idx;
        else if (h === "reposts (total)") colMap.reposts = idx;
        else if (h === "engagement rate (total)") colMap.engagementRate = idx;
        else if (h === "engagement rate (organic)") colMap.organicEngagementRate = idx;
      });

      const records = [];
      for (let i = r + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (isRowEmpty(row)) continue;
        const dateRaw = colMap.date != null ? row[colMap.date] : null;
        const date = parseDateCell(dateRaw, { dayFirst: false });
        const impressions = parseNumber(row[colMap.impressions]) || 0;
        const organicImpressions = parseNumber(row[colMap.organicImpressions]) || 0;
        const sponsoredImpressions = parseNumber(row[colMap.sponsoredImpressions]) || 0;
        const uniqueImpressions = parseNumber(row[colMap.uniqueImpressions]) || 0;
        const clicks = parseNumber(row[colMap.clicks]) || 0;
        const organicClicks = parseNumber(row[colMap.organicClicks]) || 0;
        const reactions = parseNumber(row[colMap.reactions]) || 0;
        const comments = parseNumber(row[colMap.comments]) || 0;
        const reposts = parseNumber(row[colMap.reposts]) || 0;
        const engagements = reactions + comments + reposts;
        const engagementRate = parsePercent(row[colMap.engagementRate]) ?? (impressions ? (engagements / impressions) * 100 : 0);
        const organicEngagementRate = parsePercent(row[colMap.organicEngagementRate]) ?? 0;

        records.push({
          id: `${fileName}::${sheetName}::${i}`,
          platform: "LinkedIn",
          subType: "metric",
          date,
          impressions,
          organicImpressions,
          sponsoredImpressions,
          uniqueImpressions,
          clicks,
          organicClicks,
          reactions,
          comments,
          reposts,
          engagements,
          engagementRate,
          organicEngagementRate,
          file: fileName,
          sheet: sheetName,
        });
      }

      if (records.length) {
        return {
          channel: "social",
          records,
          mapping: { headerRow: r, header: rawHeader.map(String), map: colMap, dayFirst: { dayFirst: false } },
        };
      }
    }
  }

  // 2. LinkedIn "All posts" sheet (Individual post performance)
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rawHeader = rows[r] || [];
    const headerNorm = rawHeader.map((c) => String(c || "").toLowerCase().trim());
    if (headerNorm.includes("post title") && (headerNorm.includes("post link") || headerNorm.includes("click through rate (ctr)"))) {
      const colMap = {};
      headerNorm.forEach((h, idx) => {
        if (h === "post title") colMap.title = idx;
        else if (h === "post link") colMap.link = idx;
        else if (h === "post type") colMap.postType = idx;
        else if (h === "posted by") colMap.author = idx;
        else if (h === "created date") colMap.date = idx;
        else if (h === "audience") colMap.audience = idx;
        else if (h === "impressions") colMap.impressions = idx;
        else if (h === "views") colMap.views = idx;
        else if (h === "clicks") colMap.clicks = idx;
        else if (h.includes("click through rate") || h === "ctr") colMap.ctr = idx;
        else if (h === "likes" || h === "reactions") colMap.likes = idx;
        else if (h === "comments") colMap.comments = idx;
        else if (h === "reposts") colMap.reposts = idx;
        else if (h === "engagement rate") colMap.engagementRate = idx;
        else if (h === "content type") colMap.contentType = idx;
      });

      const records = [];
      for (let i = r + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (isRowEmpty(row)) continue;
        const dateRaw = colMap.date != null ? row[colMap.date] : null;
        const date = parseDateCell(dateRaw, { dayFirst: false });
        const title = String(row[colMap.title] || "").trim();
        const link = String(row[colMap.link] || "").trim();
        const rawAuthor = String(row[colMap.author] || "").trim();
        const author = "Tecnoprism";
        const postType = String(row[colMap.postType] || "Organic").trim();
        const contentType = String(row[colMap.contentType] || "").trim();
        const impressions = parseNumber(row[colMap.impressions]) || 0;
        const views = parseNumber(row[colMap.views]) || 0;
        const clicks = parseNumber(row[colMap.clicks]) || 0;
        const ctr = parsePercent(row[colMap.ctr]) ?? (impressions ? (clicks / impressions) * 100 : 0);
        const likes = parseNumber(row[colMap.likes]) || 0;
        const comments = parseNumber(row[colMap.comments]) || 0;
        const reposts = parseNumber(row[colMap.reposts]) || 0;
        const engagements = likes + comments + reposts;
        const rawEngRate = row[colMap.engagementRate];
        const engagementRate = parsePercent(rawEngRate) ?? (impressions ? (((engagements + clicks) / impressions) * 100) : 0);

        records.push({
          id: `${fileName}::${sheetName}::${i}`,
          platform: "LinkedIn",
          subType: "post",
          title,
          link,
          author,
          postedBy: rawAuthor || "Tecnoprism",
          date,
          postType,
          contentType: contentType || (link.includes("video") || views > 0 ? "Video" : "Post"),
          impressions,
          views,
          clicks,
          ctr,
          likes,
          reactions: likes,
          comments,
          reposts,
          engagements,
          engagementRate,
          file: fileName,
          sheet: sheetName,
        });
      }

      if (records.length) {
        return {
          channel: "social",
          records,
          mapping: { headerRow: r, header: rawHeader.map(String), map: colMap, dayFirst: { dayFirst: false } },
        };
      }
    }
  }

  // 3. LinkedIn "New followers" sheet (Daily follower growth)
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rawHeader = rows[r] || [];
    const headerNorm = rawHeader.map((c) => String(c || "").toLowerCase().trim());
    if (headerNorm.includes("organic followers") && (headerNorm.includes("total followers") || headerNorm.includes("auto-invited followers"))) {
      const colMap = {};
      headerNorm.forEach((h, idx) => {
        if (h === "date") colMap.date = idx;
        else if (h.includes("organic")) colMap.organic = idx;
        else if (h.includes("sponsored")) colMap.sponsored = idx;
        else if (h.includes("auto-invited")) colMap.autoInvited = idx;
        else if (h.includes("total")) colMap.total = idx;
      });

      const records = [];
      for (let i = r + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (isRowEmpty(row)) continue;
        const dateRaw = colMap.date != null ? row[colMap.date] : null;
        const date = parseDateCell(dateRaw, { dayFirst: false });
        const organic = parseNumber(row[colMap.organic]) || 0;
        const sponsored = parseNumber(row[colMap.sponsored]) || 0;
        const autoInvited = parseNumber(row[colMap.autoInvited]) || 0;
        const newFollowers = parseNumber(row[colMap.total]) || (organic + sponsored + autoInvited);

        records.push({
          id: `${fileName}::${sheetName}::${i}`,
          platform: "LinkedIn",
          subType: "followerGrowth",
          date,
          organic,
          sponsored,
          autoInvited,
          newFollowers,
          file: fileName,
          sheet: sheetName,
        });
      }

      if (records.length) {
        return {
          channel: "social",
          records,
          mapping: { headerRow: r, header: rawHeader.map(String), map: colMap, dayFirst: { dayFirst: false } },
        };
      }
    }
  }

  // 4. LinkedIn Follower Demographics sheets (Location, Job function, Seniority, Industry, Company size)
  for (let r = 0; r < Math.min(rows.length, 3); r++) {
    const rawHeader = rows[r] || [];
    const headerNorm = rawHeader.map((c) => String(c || "").toLowerCase().trim());
    if (headerNorm.includes("total followers") && rawHeader.length >= 2) {
      const sNorm = sheetName.toLowerCase().trim();
      let category = "other";
      if (sNorm.includes("seniority") || headerNorm.some((h) => h.includes("seniority"))) category = "seniority";
      else if (sNorm.includes("function") || headerNorm.some((h) => h.includes("job function"))) category = "function";
      else if (sNorm.includes("location") || headerNorm.some((h) => h.includes("location"))) category = "location";
      else if (sNorm.includes("industry") || headerNorm.some((h) => h.includes("industry"))) category = "industry";
      else if (sNorm.includes("company size") || sNorm.includes("size") || headerNorm.some((h) => h.includes("company size"))) category = "companySize";

      const totalIdx = headerNorm.indexOf("total followers");
      const labelIdx = totalIdx === 0 ? 1 : 0;

      const records = [];
      for (let i = r + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (isRowEmpty(row)) continue;
        const label = String(row[labelIdx] || "").trim();
        const count = parseNumber(row[totalIdx]);
        if (!label || count == null) continue;

        records.push({
          id: `${fileName}::${sheetName}::${i}`,
          platform: "LinkedIn",
          subType: "demographic",
          category,
          label,
          count,
          file: fileName,
          sheet: sheetName,
        });
      }

      if (records.length) {
        return {
          channel: "social",
          records,
          mapping: { headerRow: r, header: rawHeader.map(String), map: { label: labelIdx, count: totalIdx }, dayFirst: { dayFirst: false } },
        };
      }
    }
  }

  return null;
}

/** Tries every schema in turn. Order matters only where columns overlap. */
export function detectChannelSheet(rows, context) {
  const linkedIn = parseLinkedInSheet(rows, context);
  if (linkedIn) return linkedIn;

  for (const schema of Object.values(CHANNEL_SCHEMAS)) {
    const parsed = parseChannelSheet(rows, schema, context);
    if (parsed) return parsed;
  }
  return null;
}
