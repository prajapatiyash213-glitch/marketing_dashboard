import { PipelineView, LeadsView, SourcesView } from "./index.jsx";
import { OverviewView } from "./Overview.jsx";
import { WebsitesView } from "./Websites.jsx";
import { WebsiteDropoffsView } from "./WebsiteDropoffs.jsx";
import { ChannelsView } from "./Channels.jsx";
import { TechnologyCostsView } from "./TechnologyCosts.jsx";
import { EmailCampaignsView } from "./EmailCampaigns.jsx";
import { SocialMediaView } from "./SocialMedia.jsx";

/**
 * Lazily imported from App so that recharts — by far the heaviest dependency —
 * is not downloaded by anyone who only reaches the sign-in screen.
 */
export default function ViewRouter({ view, ...props }) {
  switch (view) {
    case "pipeline": return <PipelineView {...props} />;
    case "sales-team":
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 max-w-md shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Sales Team Portal</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Redirecting to the central Sales Team administration workspace.
            </p>
            <div className="mt-6">
              <a
                href="https://sales-hazel-ten.vercel.app/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
              >
                Open Sales Admin
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      );
    case "websites": return <WebsitesView {...props} />;
    case "dropoffs": return <WebsiteDropoffsView {...props} />;
    case "channels": return <ChannelsView {...props} />;
    case "social": return <SocialMediaView {...props} />;
    case "email": return <EmailCampaignsView {...props} />;
    case "costs": return <TechnologyCostsView {...props} />;
    case "leads": return <LeadsView {...props} />;
    case "sources": return <SourcesView {...props} />;
    default: return <OverviewView {...props} />;
  }
}
