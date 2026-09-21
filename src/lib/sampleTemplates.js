import * as XLSX from "xlsx";
import { buildSampleData } from "./sampleData.js";
import { downloadBlob } from "./exporters.js";
import { EXACT_SEO_RAW_MATRIX } from "./exactSeoData.js";

const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d || ""));

export const SAMPLE_CATEGORIES = [
  {
    id: "leads",
    name: "Sales Pipeline & Leads",
    fileName: "Leads_Sheet.xlsx",
    sheetName: "Main Leads Sheet",
    color: "#FA2E76",
    badge: "Pipeline",
    badgeBg: "bg-pink-50 text-[#FA2E76] border-pink-200/60",
    description: "Multi-stage deal pipeline with customer names, deal sizes, sales stages, and attribution.",
    columns: ["Name", "Company", "Job Title", "Stage", "Source", "Status", "Value", "Date", "Pipeline"],
  },
  {
    id: "seo",
    name: "Websites & SEO Weekly Matrix",
    fileName: "SEO_Matrix_tecnoprism_com.xlsx",
    sheetName: "Website + SEO",
    color: "#00C2FF",
    badge: "SEO & Traffic",
    badgeBg: "bg-cyan-50 text-[#00C2FF] border-cyan-200/60",
    description: "Exact 11-metric × 45-week matrix of GA4 views, users, bounce rate, SEMrush AS, DAPA, leads, downloads, PA, keywords, backlinks, and AI Search.",
    columns: [
      "Traffic (GA4) - Views",
      "Traffic (GA4) - Total Users",
      "Bounce Rate",
      "Authority Score (SEMrush)",
      "Domain Authority (DAPA Checker)",
      "Leads (forms+chatbot)",
      "Downloads",
      "Page Authority (Homepage)",
      "KW Ranking (top 20)",
      "Backlinks",
      "AI Search",
    ],
  },
  {
    id: "email",
    name: "Email Marketing Campaigns",
    fileName: "Email_Campaigns.xlsx",
    sheetName: "Campaigns",
    color: "#7B61FF",
    badge: "Email",
    badgeBg: "bg-purple-50 text-[#7B61FF] border-purple-200/60",
    description: "Broadcasts and sequences with Started date/time, Mailing List, Sent, Open Rate, Click Rate, CTOR, Bounce Rate, Complaints, and Unsubs.",
    columns: ["Started", "Campaign", "Mailing List", "Sent", "Open Rate", "Unique Opens", "Click Rate", "Unique Clicks", "Click to Open Rate", "Unique Bounce Rate", "Unique Bounces", "Complaint Rate", "Unique Complaints", "Unsub Rate", "Unique Unsubs"],
  },
  {
    id: "social",
    name: "Social Media Channels",
    fileName: "Social_Performance.xlsx",
    sheetName: "Monthly",
    color: "#FF9F43",
    badge: "Social",
    badgeBg: "bg-amber-50 text-[#FF9F43] border-amber-200/60",
    description: "Multi-platform monthly metrics across LinkedIn, YouTube, X, and Instagram with reach and spend.",
    columns: ["Platform", "Month", "Posts", "Followers", "Impressions", "Engagements", "Link Clicks", "Leads", "Ad Spend"],
  },
  {
    id: "landing",
    name: "Landing Pages & GA4 Funnels",
    fileName: "Landing_Pages_GA4.xlsx",
    sheetName: "Pages",
    color: "#10B981",
    badge: "Conversion",
    badgeBg: "bg-emerald-50 text-[#10B981] border-emerald-200/60",
    description: "Key web landing pages with sessions, form-fill conversions, conversion rates, and UTM campaigns.",
    columns: ["Landing Page", "Website", "Month", "Sessions", "Conversions", "Bounce Rate", "UTM Source", "UTM Medium"],
  },
  {
    id: "cost",
    name: "Tech Stack & Tool Costs",
    fileName: "Tools_And_Costs.xlsx",
    sheetName: "Subscriptions",
    color: "#6C5CE7",
    badge: "SaaS & Ops",
    badgeBg: "bg-indigo-50 text-[#6C5CE7] border-indigo-200/60",
    description: "Exact software stack subscriptions, monthly costs, cycles, renewals, seats, and active currencies.",
    columns: ["Tool", "Category", "Owner", "Monthly Cost", "Billing Cycle", "Seats", "Renewal", "Cost per Cycle", "Currency", "Status"],
  },
];

/**
 * Builds in-memory workbook for a single category or the master all-in-one workbook.
 */
export function buildSampleWorkbook(categoryId = "all") {
  const { leads, weeks, channels } = buildSampleData();
  const wb = XLSX.utils.book_new();

  const addLeadsSheet = () => {
    const rows = leads.slice(0, 150).map((l) => ({
      "First Name": l.name.split(" ")[0],
      "Last Name": l.name.split(" ").slice(1).join(" "),
      "Company Name": l.company,
      Designation: l.title,
      "Lead Stage": l.stage,
      "Lead Source": l.source,
      "Lead Status": l.status,
      "Annual Revenue": l.value,
      Date: iso(l.date),
      Pipeline: l.pipeline,
      Website: l.site,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Main Leads Sheet");
  };

  const addSeoSheet = () => {
    const ws = XLSX.utils.aoa_to_sheet(EXACT_SEO_RAW_MATRIX);
    XLSX.utils.book_append_sheet(wb, ws, "Website + SEO");
  };

  const addEmailSheet = () => {
    const rows = [
      {
        "Started": "Sep 7, 2026 3:27pm",
        "Campaign": "Internal Employee Email – FDE Services",
        "Mailing List": "Internal Employee Email - FDE",
        "Sent": 155,
        "Open Rate": "100.00%",
        "Unique Opens": 153,
        "Click Rate": "99.35%",
        "Unique Clicks": 152,
        "Click to Open Rate": "99.35%",
        "Unique Bounce Rate": "1.29%",
        "Unique Bounces": 2,
        "Complaint Rate": "0.00%",
        "Unique Complaints": 0,
        "Unsub Rate": "0.00%",
        "Unique Unsubs": 0,
        "Leads Generated": 2,
      },
      {
        "Started": "Aug 24, 2026 7:03pm",
        "Campaign": "AutomationCEO Generic M&R 002",
        "Mailing List": "ZoomInfo_Retail_Manufacturing_US_003",
        "Sent": 5329,
        "Open Rate": "43.56%",
        "Unique Opens": 1875,
        "Click Rate": "28.58%",
        "Unique Clicks": 1230,
        "Click to Open Rate": "65.60%",
        "Unique Bounce Rate": "19.23%",
        "Unique Bounces": 1025,
        "Complaint Rate": "0.00%",
        "Unique Complaints": 0,
        "Unsub Rate": "0.26%",
        "Unique Unsubs": 11,
        "Leads Generated": 18,
      },
      {
        "Started": "Aug 7, 2026 6:29pm",
        "Campaign": "AutomationCEO 002 M&R AA Attachment",
        "Mailing List": "ZoomInfo_Retail_Manufacturing_US",
        "Sent": 1071,
        "Open Rate": "63.26%",
        "Unique Opens": 520,
        "Click Rate": "52.19%",
        "Unique Clicks": 429,
        "Click to Open Rate": "82.50%",
        "Unique Bounce Rate": "23.25%",
        "Unique Bounces": 249,
        "Complaint Rate": "0.00%",
        "Unique Complaints": 0,
        "Unsub Rate": "0.12%",
        "Unique Unsubs": 1,
        "Leads Generated": 12,
      },
      {
        "Started": "Aug 3, 2026 5:54pm",
        "Campaign": "AutomationCEO 001",
        "Mailing List": "CFO 001",
        "Sent": 78,
        "Open Rate": "51.61%",
        "Unique Opens": 32,
        "Click Rate": "45.16%",
        "Unique Clicks": 28,
        "Click to Open Rate": "87.50%",
        "Unique Bounce Rate": "20.51%",
        "Unique Bounces": 16,
        "Complaint Rate": "0.00%",
        "Unique Complaints": 0,
        "Unsub Rate": "0.00%",
        "Unique Unsubs": 0,
        "Leads Generated": 4,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Campaigns");
  };

  const addSocialSheet = () => {
    const rows = channels.social.map((r) => ({
      Platform: r.platform,
      Month: iso(r.date),
      Posts: r.posts,
      Followers: r.followers,
      Impressions: r.impressions,
      Engagements: r.engagements,
      "Link Clicks": r.clicks,
      "Leads Generated": r.leads,
      "Ad Spend": r.spend,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Monthly");
  };

  const addLandingSheet = () => {
    const rows = channels.landing.map((r) => ({
      "Landing Page": r.page,
      Website: r.site,
      Month: iso(r.date),
      Sessions: r.sessions,
      Conversions: r.conversions,
      "Bounce Rate": `${r.bounce}%`,
      "UTM Source": r.source,
      "UTM Medium": r.medium,
      "UTM Campaign": r.campaign,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
  };

  const addCostSheet = () => {
    const aoa = [
      ["Tool", "Category", "Owner", "Monthly Cost", "Billing Cycle", "Seats", "Renewal", "Cost per Cycle", "Currency", "Status"],
      ["Apollo.io", "Data & Outreach", "shashank.jha@tecnoprism.com", "$476.00", "Annual", "", "2027-02-10", "$5,712.00", "USD", "Active"],
      ["Copy.ai", "Content", "", "$29.40", "Monthly", "", "Apr 2026", "$29.40", "USD", "Cancelled"],
      ["Freepik", "Images, PSDs, Designs", "", "₹1,264.96", "Monthly", "", "", "₹1,264.96", "INR", "Active"],
      ["Freepik", "Images, PSDs, Designs", "", "₹859.04", "Annual", "", "", "₹10,308.48", "INR", "Active"],
      ["Canva", "Design", "shashank.jha@tecnoprism.com", "₹333.33", "Annual", "", "2027-04-07", "₹4,000.00", "INR", "Active"],
      ["Higgsfield", "AI Videos", "yash.prajapati@tecnoprism.com", "₹3,574.25", "2 Years", "", "Jan 2028", "₹85,782.00", "INR", "Active"],
      ["Adobe CC", "Design", "shashank.jha@tecnoprism.com", "₹2,300.00", "Monthly", "", "", "₹2,300.00", "INR", "Active"],
      ["ChatGPT Business", "AI Assistant", "shashank.jha@tecnoprism.com, marketing@tecnoprism.com", "₹3,600.00", "Annual", 2, "2027-07-30", "₹43,200.00", "INR", "Active"],
      ["Claude Pro", "AI Assistant", "yash.prajapati@tecnoprism.com", "₹1,694.85", "Annual", 1, "2027-07-30", "₹20,338.14", "INR", "Active"],
      ["Semrush (via SEOToolAdda)", "SEO", "", "", "Irregular", "", "", "", "", "Ad hoc"],
      ["Magnific & Envato (via Pixhub)", "AI Upscaling & Stock Assets", "", "", "Irregular", "", "", "", "", "Ad hoc"],
      [],
      ["", "", "Total (INR, active)", "₹13,626.43"],
      ["", "", "Total (USD, active)", "$476.00"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
  };

  if (categoryId === "leads") addLeadsSheet();
  else if (categoryId === "seo") addSeoSheet();
  else if (categoryId === "email") addEmailSheet();
  else if (categoryId === "social") addSocialSheet();
  else if (categoryId === "landing") addLandingSheet();
  else if (categoryId === "cost") addCostSheet();
  else {
    // Master workbook: all 6 sheets
    addLeadsSheet();
    addSeoSheet();
    addEmailSheet();
    addSocialSheet();
    addLandingSheet();
    addCostSheet();
  }

  return wb;
}

/**
 * Downloads a sample .xlsx file directly to the user's computer.
 */
export function downloadSampleSheet(categoryId = "all") {
  const cat = SAMPLE_CATEGORIES.find((c) => c.id === categoryId);
  const fileName = cat ? cat.fileName : "OmniScope_All_Categories_Sample.xlsx";
  const wb = buildSampleWorkbook(categoryId);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    fileName
  );
}
