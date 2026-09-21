import { utcDay, addDays, startOfWeek, prettyDate, MONTHS } from "./dates.js";
import { STAGES } from "./stages.js";
import { SITES } from "./segments.js";
import { EXACT_SEO_DATA } from "./exactSeoData.js";

export { EXACT_SEO_DATA } from "./exactSeoData.js";

/** Seeded so screenshots and demos are reproducible. */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aarav", "Meera", "Rohan", "Ishita", "Vikram", "Neha", "Karan", "Priya", "Devansh", "Ananya", "Siddharth", "Tara", "Nikhil", "Kavya", "Arjun", "Sanya", "Rahul", "Divya", "Manav", "Ritu", "Imran", "Sneha", "Yash", "Pooja"];
const LAST = ["Mehta", "Iyer", "Shah", "Nair", "Kulkarni", "Bose", "Rao", "Deshmukh", "Chopra", "Menon", "Bhatt", "Sinha", "Reddy", "Joshi", "Kapoor", "Verma", "Pillai", "Gandhi", "Sethi", "Malhotra"];
const CO_A = ["Arcelia", "Novaris", "Karyan", "Bluestone", "Meridian", "Vantage", "Halcyon", "Trident", "Sarvin", "Northwind", "Auralis", "Pratham", "Verdant", "Kestrel", "Orbit", "Sundara", "Lucent", "Zenith", "Cobalt"];
const CO_B = ["Industries", "Technologies", "Logistics", "Capital", "Foods", "Infra", "Systems", "Labs", "Motors", "Chemicals", "Retail", "Health", "Energy", "Textiles"];
const TITLES = ["CFO", "Finance Director", "VP Finance", "Head of Procurement", "Group Controller", "COO", "IT Director", "Head of Automation", "CEO", "Plant Head"];

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function weighted(rand, items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let t = rand() * total;
  for (let i = 0; i < items.length; i++) { t -= weights[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}

const DEFS = [
  { name: "Website Visitors Leads Sheet.xlsx", sheet: "Website Visitors - People", pipeline: "Inbound web", site: "tecnoprism.com", count: 168, sources: ["Organic Search", "Direct", "LinkedIn", "Referral", "Paid Search"], weights: [54, 22, 12, 6, 18] },
  { name: "CFO_Event_Live_Lead_Sheet.xlsx", sheet: "CFO Sheet", pipeline: "Events", site: "tecnoprism.com", count: 74, sources: ["CFO Event", "Event Booth", "Speaker Session"], weights: [20, 32, 22, 16, 10] },
  { name: "Imagine 26.xlsx", sheet: "Imagine 26", pipeline: "Events", site: "automationcoe.com", count: 96, sources: ["Imagine 26", "Partner Referral", "Sponsor List"], weights: [28, 30, 18, 12, 12] },
  { name: "Leads Sheet.xlsx", sheet: "Main Leads Sheet", pipeline: "Outbound", site: "tecnoprism.com", count: 174, sources: ["Outbound", "Organic Search", "Referral", "LinkedIn", "Webinar"], weights: [42, 26, 15, 11, 20] },
  { name: "Automation CoE Leads.xlsx", sheet: "AutomationCoE Pipeline", pipeline: "Automation CoE", site: "automationcoe.com", count: 118, sources: ["Organic Search", "Paid Search", "Webinar", "Partner Referral", "Chatbot"], weights: [46, 28, 16, 10, 16] },
];

export function buildSampleData(seed = 20260909) {
  const rand = mulberry32(seed);
  const end = utcDay(2026, 6, 31);
  const span = 260;
  const leads = [];

  const files = DEFS.map((def) => {
    for (let i = 0; i < def.count; i++) {
      const stage = weighted(rand, STAGES, def.weights);
      const status =
        stage === "Closed Won" ? "Won"
        : stage === "Closed Lost" ? (rand() > 0.5 ? "Not interested" : "On hold")
        : stage === "Proposal" ? "Proposal sent"
        : stage === "Qualified" ? (rand() > 0.5 ? "Meeting booked" : "Follow-up scheduled")
        : rand() > 0.5 ? "New" : "Contacted";
      const date = addDays(end, -Math.floor(Math.pow(rand(), 1.6) * span));
      leads.push({
        id: `${def.name}::${def.sheet}::${i}`,
        name: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
        company: `${pick(rand, CO_A)} ${pick(rand, CO_B)}`,
        title: pick(rand, TITLES),
        stage,
        stageRaw: stage,
        source: pick(rand, def.sources),
        status,
        value: Math.round((0.6 + rand() * 9.4) * 100000) * (stage === "Closed Won" ? 1.4 : 1),
        pipeline: def.pipeline,
        site: def.site,
        campaign: "",
        medium: "",
        email: "",
        phone: "",
        date,
        dateText: prettyDate(date),
        file: def.name,
        sheet: def.sheet,
      });
    }
    return {
      name: def.name,
      leadCount: def.count,
      seoCount: 0,
      channelCount: 0,
      sheets: [{ sheet: def.sheet, kind: "leads", count: def.count, pipeline: def.pipeline, site: def.site }],
    };
  });

  // Website + SEO exact 45-week matrix matching the uploaded spreadsheet
  const weeks = EXACT_SEO_DATA.map((w) => ({ ...w }));
  files.push({
    name: "SEO_Matrix_tecnoprism_com.xlsx",
    leadCount: 0,
    seoCount: EXACT_SEO_DATA.length,
    channelCount: 0,
    sheets: [{ sheet: "Weekly Matrix", kind: "seo", count: EXACT_SEO_DATA.length, site: "tecnoprism.com" }],
  });

  const channels = buildChannels(rand, end, files);
  return { leads, weeks, channels, files };
}

const EMAIL_CAMPAIGNS = [
  "Automation maturity benchmark", "CFO briefing invite", "Imagine 26 save the date",
  "P2P automation case study", "Quarterly product update", "Webinar: agentic procurement",
  "Year-end automation checklist", "Re-engagement: dormant accounts", "Partner co-marketing blast",
  "Autonomous IT use-case digest", "Plant modernisation guide", "Imagine 26 last call",
];
const PLATFORMS = ["LinkedIn", "X", "YouTube", "Instagram"];
export const EXACT_SAMPLE_TOOLS = [
  { tool: "Apollo.io", category: "Data & Outreach", owner: "shashank.jha@tecnoprism.com", monthlyCost: 476.00, cycle: "Annual", seats: null, renewal: "2027-02-10", costPerCycle: 5712.00, currency: "USD", status: "Active" },
  { tool: "Copy.ai", category: "Content", owner: "", monthlyCost: 29.40, cycle: "Monthly", seats: null, renewal: "Apr 2026", costPerCycle: 29.40, currency: "USD", status: "Cancelled" },
  { tool: "Freepik", category: "Images, PSDs, Designs", owner: "", monthlyCost: 1264.96, cycle: "Monthly", seats: null, renewal: "", costPerCycle: 1264.96, currency: "INR", status: "Active" },
  { tool: "Freepik", category: "Images, PSDs, Designs", owner: "", monthlyCost: 859.04, cycle: "Annual", seats: null, renewal: "", costPerCycle: 10308.48, currency: "INR", status: "Active" },
  { tool: "Canva", category: "Design", owner: "shashank.jha@tecnoprism.com", monthlyCost: 333.33, cycle: "Annual", seats: null, renewal: "2027-04-07", costPerCycle: 4000.00, currency: "INR", status: "Active" },
  { tool: "Higgsfield", category: "AI Videos", owner: "yash.prajapati@tecnoprism.com", monthlyCost: 3574.25, cycle: "2 Years", seats: null, renewal: "Jan 2028", costPerCycle: 85782.00, currency: "INR", status: "Active" },
  { tool: "Adobe CC", category: "Design", owner: "shashank.jha@tecnoprism.com", monthlyCost: 2300.00, cycle: "Monthly", seats: null, renewal: "", costPerCycle: 2300.00, currency: "INR", status: "Active" },
  { tool: "ChatGPT Business", category: "AI Assistant", owner: "shashank.jha@tecnoprism.com, marketing@tecnoprism.com", monthlyCost: 3600.00, cycle: "Annual", seats: 2, renewal: "2027-07-30", costPerCycle: 43200.00, currency: "INR", status: "Active" },
  { tool: "Claude Pro", category: "AI Assistant", owner: "yash.prajapati@tecnoprism.com", monthlyCost: 1694.85, cycle: "Annual", seats: 1, renewal: "2027-07-30", costPerCycle: 20338.14, currency: "INR", status: "Active" },
  { tool: "Semrush (via SEOToolAdda)", category: "SEO", owner: "", monthlyCost: null, cycle: "Irregular", seats: null, renewal: "", costPerCycle: null, currency: "", status: "Ad hoc" },
  { tool: "Magnific & Envato (via Pixhub)", category: "AI Upscaling & Stock Assets", owner: "", monthlyCost: null, cycle: "Irregular", seats: null, renewal: "", costPerCycle: null, currency: "", status: "Ad hoc" },
];
const LANDING_PAGES = [
  ["/imagine-26", "automationcoe.com", "event"],
  ["/p2p-automation", "automationcoe.com", "product"],
  ["/cfo-briefing", "tecnoprism.com", "event"],
  ["/autonomous-it", "tecnoprism.com", "product"],
  ["/contact", "tecnoprism.com", "always-on"],
  ["/automation-maturity-quiz", "automationcoe.com", "campaign"],
];

export const EXACT_SAMPLE_EMAIL_CAMPAIGNS = [
  {
    id: "sample-email-0",
    campaign: "Internal Employee Email – FDE Services",
    list: "Internal Employee Email - FDE",
    started: "Sep 7, 2026 3:27pm",
    date: new Date(Date.UTC(2026, 8, 7, 15, 27)),
    sent: 155,
    delivered: 153,
    openRate: 100.0,
    opens: 153,
    clickRate: 99.35,
    ctr: 99.35,
    clicks: 152,
    ctor: 99.35,
    bounceRate: 1.29,
    bounces: 2,
    complaintRate: 0.0,
    complaints: 0,
    unsubRate: 0.0,
    unsubscribes: 0,
    leads: 2,
    cost: 0,
    clickToLead: 1.32,
    site: "tecnoprism.com",
    file: "Email_Campaigns.xlsx",
    sheet: "Campaigns",
  },
  {
    id: "sample-email-1",
    campaign: "AutomationCEO Generic M&R 002",
    list: "ZoomInfo_Retail_Manufacturing_US_003",
    started: "Aug 24, 2026 7:03pm",
    date: new Date(Date.UTC(2026, 7, 24, 19, 3)),
    sent: 5329,
    delivered: 4304,
    openRate: 43.56,
    opens: 1875,
    clickRate: 28.58,
    ctr: 28.58,
    clicks: 1230,
    ctor: 65.6,
    bounceRate: 19.23,
    bounces: 1025,
    complaintRate: 0.0,
    complaints: 0,
    unsubRate: 0.26,
    unsubscribes: 11,
    leads: 18,
    cost: 3200,
    clickToLead: 1.46,
    site: "automationcoe.com",
    file: "Email_Campaigns.xlsx",
    sheet: "Campaigns",
  },
  {
    id: "sample-email-2",
    campaign: "AutomationCEO 002 M&R AA Attachment",
    list: "ZoomInfo_Retail_Manufacturing_US",
    started: "Aug 7, 2026 6:29pm",
    date: new Date(Date.UTC(2026, 7, 7, 18, 29)),
    sent: 1071,
    delivered: 822,
    openRate: 63.26,
    opens: 520,
    clickRate: 52.19,
    ctr: 52.19,
    clicks: 429,
    ctor: 82.5,
    bounceRate: 23.25,
    bounces: 249,
    complaintRate: 0.0,
    complaints: 0,
    unsubRate: 0.12,
    unsubscribes: 1,
    leads: 12,
    cost: 1500,
    clickToLead: 2.8,
    site: "automationcoe.com",
    file: "Email_Campaigns.xlsx",
    sheet: "Campaigns",
  },
  {
    id: "sample-email-3",
    campaign: "AutomationCEO 001",
    list: "CFO 001",
    started: "Aug 3, 2026 5:54pm",
    date: new Date(Date.UTC(2026, 7, 3, 17, 54)),
    sent: 78,
    delivered: 62,
    openRate: 51.61,
    opens: 32,
    clickRate: 45.16,
    ctr: 45.16,
    clicks: 28,
    ctor: 87.5,
    bounceRate: 20.51,
    bounces: 16,
    complaintRate: 0.0,
    complaints: 0,
    unsubRate: 0.0,
    unsubscribes: 0,
    leads: 4,
    cost: 500,
    clickToLead: 14.29,
    site: "automationcoe.com",
    file: "Email_Campaigns.xlsx",
    sheet: "Campaigns",
  },
];

function buildChannels(rand, end, files) {
  const email = EXACT_SAMPLE_EMAIL_CAMPAIGNS.map((c) => ({ ...c }));

  const social = [];
  for (const platform of PLATFORMS) {
    let followers = platform === "LinkedIn" ? 8400 : platform === "YouTube" ? 1900 : 3200;
    for (let m = 8; m >= 0; m--) {
      const date = addDays(end, -m * 30);
      followers = Math.round(followers * (1 + rand() * 0.05));
      const impressions = Math.round((platform === "LinkedIn" ? 26000 : 9000) * (0.7 + rand() * 0.8));
      const engagements = Math.round(impressions * (0.018 + rand() * 0.045));
      const clicks = Math.round(engagements * (0.14 + rand() * 0.3));
      const leads = Math.round(clicks * (0.03 + rand() * 0.09));
      social.push({
        id: `sample-social-${platform}-${m}`, platform, date,
        posts: Math.round(6 + rand() * 14), followers, impressions, engagements, clicks, leads,
        spend: platform === "LinkedIn" ? Math.round(18000 + rand() * 32000) : Math.round(rand() * 9000),
        engagementRate: (engagements / impressions) * 100,
        ctr: (clicks / impressions) * 100,
        file: "Social_Performance.xlsx", sheet: "Monthly",
      });
    }
  }

  const landing = [];
  for (const [page, site, kind] of LANDING_PAGES) {
    for (let m = 5; m >= 0; m--) {
      const date = addDays(end, -m * 30);
      const sessions = Math.round((kind === "always-on" ? 2600 : 900) * (0.5 + rand() * 1.1));
      const conversions = Math.round(sessions * (0.015 + rand() * 0.07));
      landing.push({
        id: `sample-landing-${page}-${m}`, page, site, date, sessions, conversions,
        bounce: Math.round((38 + rand() * 28) * 10) / 10,
        source: rand() > 0.5 ? "google" : "linkedin",
        medium: kind === "campaign" ? "cpc" : "organic",
        campaign: kind === "event" ? "imagine-26" : "always-on",
        conversionRate: (conversions / sessions) * 100,
        file: "Landing_Pages_GA4.xlsx", sheet: "Pages",
      });
    }
  }

  const cost = EXACT_SAMPLE_TOOLS.map((t, i) => ({
    id: `sample-cost-${i}`,
    ...t,
    amount: t.monthlyCost ?? t.costPerCycle ?? 0,
    annual: t.costPerCycle ?? (t.monthlyCost ? t.monthlyCost * 12 : 0),
    date: t.renewal ? new Date(t.renewal) : null,
    file: "Tools_And_Costs.xlsx",
    sheet: "Subscriptions",
  }));

  files.push(
    { name: "Email_Campaigns.xlsx", leadCount: 0, seoCount: 0, channelCount: email.length, sheets: [{ sheet: "Campaigns", kind: "email", label: "Email marketing", count: email.length }] },
    { name: "Social_Performance.xlsx", leadCount: 0, seoCount: 0, channelCount: social.length, sheets: [{ sheet: "Monthly", kind: "social", label: "Social media", count: social.length }] },
    { name: "Landing_Pages_GA4.xlsx", leadCount: 0, seoCount: 0, channelCount: landing.length, sheets: [{ sheet: "Pages", kind: "landing", label: "Landing pages", count: landing.length }] },
    { name: "Tools_And_Costs.xlsx", leadCount: 0, seoCount: 0, channelCount: cost.length, sheets: [{ sheet: "Subscriptions", kind: "cost", label: "Tools & spend", count: cost.length }] },
  );

  return { email, social, landing, cost };
}
