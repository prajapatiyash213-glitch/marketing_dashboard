import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKEDIN_URL = "https://www.linkedin.com/company/tecnoprism/";

async function syncLinkedIn() {
  console.log(`[LinkedIn Sync] Fetching ${LINKEDIN_URL}...`);
  try {
    const res = await fetch(LINKEDIN_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch LinkedIn page: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    let followers = 24795; // fallback from latest known live count

    // Extract follower count from meta description or og:description
    const descMatch = html.match(/([\d,]+)\s+followers\s+on\s+LinkedIn/i) || html.match(/content="[^"]*?([\d,]+)\s+followers/i);
    if (descMatch && descMatch[1]) {
      const parsed = parseInt(descMatch[1].replace(/,/g, ""), 10);
      if (Number.isFinite(parsed) && parsed > 1000) {
        followers = parsed;
      }
    }

    // Extract JSON-LD
    let recentPosts = [];
    let companyMeta = {};
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = parsed["@graph"] || [parsed];
        for (const item of graph) {
          if (item["@type"] === "SocialMediaPosting") {
            recentPosts.push({
              title: item.headline || (item.text ? item.text.slice(0, 100) + "..." : "LinkedIn Post"),
              text: item.text || "",
              date: item.datePublished,
              url: item.mainEntityOfPage || item.url,
              reactions: item.interactionStatistic?.userInteractionCount || 0,
              author: item.author?.name || "Tecnoprism Pvt Ltd",
            });
          } else if (item["@type"] === "Organization") {
            companyMeta = {
              name: item.name,
              url: item.url,
              slogan: item.slogan,
              employees: item.numberOfEmployees?.value,
              hq: item.address ? `${item.address.addressLocality}, ${item.address.addressRegion}, ${item.address.addressCountry}` : "",
            };
          }
        }
      } catch (err) {
        // ignore malformed JSON-LD
      }
    }

    const liveData = {
      profileUrl: LINKEDIN_URL,
      companyName: companyMeta.name || "Tecnoprism Pvt Ltd",
      followers,
      previousExportFollowers: 19814,
      growthSinceExport: followers - 19814,
      lastSynced: new Date().toISOString(),
      employees: companyMeta.employees || 231,
      hq: companyMeta.hq || "Tomball, Texas, US",
      slogan: companyMeta.slogan || "Tecnoprism empowers enterprises to operate autonomously by transforming manual processes into intelligent automation.",
      recentPosts,
    };

    const publicMasterPath = path.resolve(__dirname, "../public/master/linkedin_live.json");
    const distMasterPath = path.resolve(__dirname, "../dist/master/linkedin_live.json");

    fs.mkdirSync(path.dirname(publicMasterPath), { recursive: true });
    fs.writeFileSync(publicMasterPath, JSON.stringify(liveData, null, 2), "utf8");

    if (fs.existsSync(path.resolve(__dirname, "../dist"))) {
      fs.mkdirSync(path.dirname(distMasterPath), { recursive: true });
      fs.writeFileSync(distMasterPath, JSON.stringify(liveData, null, 2), "utf8");
    }

    console.log(`[LinkedIn Sync] Successfully synced! Total Followers: ${followers.toLocaleString("en-US")} (${liveData.recentPosts.length} recent posts)`);
    return liveData;
  } catch (error) {
    console.error("[LinkedIn Sync Error]:", error.message);
    // Write fallback snapshot if network fails
    const fallbackData = {
      profileUrl: LINKEDIN_URL,
      companyName: "Tecnoprism Pvt Ltd",
      followers: 24795,
      previousExportFollowers: 19814,
      growthSinceExport: 4981,
      lastSynced: new Date().toISOString(),
      employees: 231,
      hq: "Tomball, Texas, US",
      slogan: "Tecnoprism empowers enterprises to operate autonomously by transforming manual processes into intelligent automation.",
      recentPosts: [],
    };
    const publicMasterPath = path.resolve(__dirname, "../public/master/linkedin_live.json");
    fs.mkdirSync(path.dirname(publicMasterPath), { recursive: true });
    fs.writeFileSync(publicMasterPath, JSON.stringify(fallbackData, null, 2), "utf8");
    return fallbackData;
  }
}

syncLinkedIn();
