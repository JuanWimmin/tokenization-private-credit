import {
  Card,
  CardContent,
  CardHeader,
} from "@tokenization/ui/card";
import type { Campaign } from "../types/campaign.types";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { ClaimRoiButton } from "./claim-roi-button";

type CampaignCardProps = {
  campaign: Campaign;
  onClaimRoi?: (campaignId: string) => void;
};

function formatMinInvest(cents: number, currency: string): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CampaignCard({ campaign, onClaimRoi }: CampaignCardProps) {
  return (
    <Card className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 px-6 pt-6 gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground leading-tight pr-2">
            {campaign.title}
          </h3>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-sm text-muted-foreground leading-snug mt-1">
          {campaign.description}
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex flex-row items-end justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Loans completed
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {campaign.loansCompleted}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Min. invest
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {formatMinInvest(campaign.minInvestCents, campaign.currency)}
            </p>
          </div>
        </div>
        <ClaimRoiButton campaignId={campaign.id} onClick={onClaimRoi} />
      </CardContent>
    </Card>
  );
}
