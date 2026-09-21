/**
 * Generates sample workbooks with deliberately mismatched headers, so the
 * import path can be exercised without real customer data.
 *   node scripts/make-samples.mjs
 */
import * as XLSX from "xlsx";
import { mkdirSync } from "node:fs";
import { buildSampleData } from "../src/lib/sampleData.js";

const OUT = new URL("../samples/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const { leads, weeks, channels } = buildSampleData();
const iso = (d) => d.toISOString().slice(0, 10);
const ddmmyyyy = (d) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;

const write = (rows, sheetName, fileName, aoaPrefix = []) => {
  const ws = XLSX.utils.aoa_to_sheet(aoaPrefix);
  XLSX.utils.sheet_add_json(ws, rows, { origin: aoaPrefix.length });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, OUT + fileName);
  console.log("wrote", fileName, `(${rows.length} rows)`);
};

const of = (file) => leads.filter((l) => l.file === file);

// Split first/last name, Indian date format, currency as text.
write(
  of("Leads Sheet.xlsx").map((l) => ({
    "First Name": l.name.split(" ")[0],
    "Last Name": l.name.split(" ").slice(1).join(" "),
    "Company Name": l.company,
    Designation: l.title,
    "Lead Stage": l.stage,
    "Lead Source": l.source,
    "Lead Status": l.status,
    "Annual Revenue": `₹${l.value.toLocaleString("en-IN")}`,
    Date: ddmmyyyy(l.date),
  })),
  "Main Leads Sheet",
  "Leads Sheet.xlsx"
);

// Single name column, ISO dates, numeric value, title row above the header.
write(
  of("Website Visitors Leads Sheet.xlsx").map((l) => ({
    Name: l.name,
    Company: l.company,
    Stage: l.stage,
    "Lead Type": l.source,
    "Current Status": l.status,
    "Lead Value": l.value,
    "Visit Date": iso(l.date),
  })),
  "Website Visitors - People",
  "Website Visitors Leads Sheet.xlsx",
  [["Website visitors export — generated sample"], []]
);

// Event list: no stage column at all, only a status.
write(
  of("CFO_Event_Live_Lead_Sheet.xlsx").map((l) => ({
    Attendee: l.name,
    Organisation: l.company,
    Role: l.title,
    Source: l.source,
    Status: l.status,
    Potential: `${(l.value / 100000).toFixed(1)} lakh`,
    "Captured On": iso(l.date),
  })),
  "CFO Sheet",
  "CFO_Event_Live_Lead_Sheet.xlsx"
);

write(
  of("Imagine 26.xlsx").map((l) => ({
    Name: l.name,
    Account: l.company,
    Stage: l.stage,
    Channel: l.source,
    Status: l.status,
    Value: l.value,
    Created: iso(l.date),
  })),
  "Imagine 26",
  "Imagine 26.xlsx"
);

write(
  of("Automation CoE Leads.xlsx").map((l) => ({
    Name: l.name,
    Company: l.company,
    Pipeline: l.pipeline,
    Website: l.site,
    Stage: l.stage,
    Source: l.source,
    "Lead Status": l.status,
    "Lead Value": l.value,
    Date: iso(l.date),
  })),
  "AutomationCoE Pipeline",
  "Automation CoE Leads.xlsx"
);

// One horizontal SEO matrix per web property. Week headers carry no year, which
// is how these sheets are really written — the parser infers it.
const aoaSheet = (aoa, sheetName, fileName) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  XLSX.writeFile(wb, OUT + fileName);
  console.log("wrote", fileName);
};

for (const site of ["tecnoprism.com", "automationcoe.com"]) {
  const siteWeeks = weeks.filter((w) => w.site === site);
  const row = (label, key, fmt = (v) => v) => [label, ...siteWeeks.map((w) => (w[key] == null ? "" : fmt(w[key])))];
  aoaSheet(
    [
      [`Weekly SEO performance — ${site}`],
      [],
      ["Metric", ...siteWeeks.map((w) => w.label)],
      row("Traffic (GA4) - Views", "views"),
      row("Total Users", "users"),
      row("Bounce Rate", "bounce", (v) => `${v}%`),
      row("Leads (forms+chatbot)", "seoLeads"),
      ["Notes", ...siteWeeks.map(() => "")],
      row("Backlinks", "backlinks"),
      row("Domain Authority", "da"),
    ],
    "Weekly Matrix",
    `SEO_Matrix_${site.replace(/\./g, "_")}.xlsx`
  );
}

// Marketing channels: each is an ordinary table with the columns the parser needs.
write(
  channels.email.map((c) => ({
    "Campaign Name": c.campaign,
    "Send Date": iso(c.date),
    Audience: c.list,
    "Emails Sent": c.sent,
    Delivered: c.delivered,
    "Unique Opens": c.opens,
    "Unique Clicks": c.clicks,
    "Leads Generated": c.leads,
    Unsubscribes: c.unsubscribes,
    Cost: c.cost,
  })),
  "Campaigns",
  "Email_Campaigns.xlsx"
);

write(
  channels.social.map((r) => ({
    Platform: r.platform,
    Month: iso(r.date),
    Posts: r.posts,
    Followers: r.followers,
    Impressions: r.impressions,
    Engagements: r.engagements,
    "Link Clicks": r.clicks,
    "Leads Generated": r.leads,
    "Ad Spend": r.spend,
  })),
  "Monthly",
  "Social_Performance.xlsx"
);

write(
  channels.landing.map((r) => ({
    "Landing Page": r.page,
    Website: r.site,
    Month: iso(r.date),
    Sessions: r.sessions,
    Conversions: r.conversions,
    "Bounce Rate": `${r.bounce}%`,
    "UTM Source": r.source,
    "UTM Medium": r.medium,
    "UTM Campaign": r.campaign,
  })),
  "Pages",
  "Landing_Pages_GA4.xlsx"
);

write(
  channels.cost.map((r) => ({
    Tool: r.tool,
    Category: r.category,
    Owner: r.owner,
    "Monthly Cost": r.amount,
    "Billing Cycle": r.cycle,
    Seats: r.seats,
    Renewal: iso(r.date),
  })),
  "Subscriptions",
  "Tools_And_Costs.xlsx"
);
