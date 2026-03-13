import type { Campaign } from "../types/campaign.types";
import { CampaignCard } from "./campaign-card";

type CampaignListProps = {
  campaigns: Campaign[];
  onClaimRoi?: (campaignId: string) => void;
};

export function CampaignList({ campaigns, onClaimRoi }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-sm">No campaigns available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onClaimRoi={onClaimRoi}
        />
      ))}
    </div>
  );
}
