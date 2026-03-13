import type { Campaign } from "@/features/campaigns/types/campaign.types";
import { CampaignCard } from "@/components/shared/campaign-card";

interface CampaignListProps {
  campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-sm">No hay campañas disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
        />
      ))}
    </div>
  );
}
