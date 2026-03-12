import type { Campaign } from "../types/campaign.types";
import { CampaignCard } from "./campaign-card";

type CampaignListProps = {
  campaigns: Campaign[];
  onClaimRoi?: (campaignId: string) => void;
};

export function CampaignList({ campaigns, onClaimRoi }: CampaignListProps) {
  return (
    <ul className="flex flex-col gap-4 list-none p-0 m-0">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <CampaignCard campaign={campaign} onClaimRoi={onClaimRoi} />
        </li>
      ))}
    </ul>
  );
}
