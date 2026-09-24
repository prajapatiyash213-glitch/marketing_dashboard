import { PipelineView, LeadsView, SourcesView } from "./index.jsx";
import { OverviewView } from "./Overview.jsx";
import { WebsitesView } from "./Websites.jsx";
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
    case "websites": return <WebsitesView {...props} />;
    case "channels": return <ChannelsView {...props} />;
    case "social": return <SocialMediaView {...props} />;
    case "email": return <EmailCampaignsView {...props} />;
    case "costs": return <TechnologyCostsView {...props} />;
    case "leads": return <LeadsView {...props} />;
    case "sources": return <SourcesView {...props} />;
    default: return <OverviewView {...props} />;
  }
}
