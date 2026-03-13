"use client";

import Link from "next/link";
import { Badge } from "@tokenization/ui/badge";
import { Button } from "@tokenization/ui/button";
import { CampaignCard as SharedCampaignCard } from "@tokenization/ui/campaign-card";
import { cn } from "@tokenization/shared/lib/utils";
import { ExternalLink, FileText } from "lucide-react";
import type { Campaign } from "../types/campaign.types";
import { CAMPAIGN_STATUS_CONFIG } from "../constants/campaign-status";

const ESCROW_EXPLORER_URL =
  "https://stellar.expert/explorer/testnet/contract/CBBTYM6SM5KATWKLNXRUOGRVVGA762EZTB6LE7XEKZAX6VHVF7SYGIFO";

interface CampaignCardProps {
  campaign: Campaign;
  onClaimRoi?: (campaignId: string) => void;
}

export function CampaignCard({ campaign, onClaimRoi }: CampaignCardProps) {
  const { title, description, status, id, loansCompleted } = campaign;
  const statusCfg = CAMPAIGN_STATUS_CONFIG[status];

  return (
    <SharedCampaignCard
      title={`#${id.slice(0, 3).toUpperCase()} ${title}`}
      description={description}
      statusBadge={
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold uppercase tracking-wide", statusCfg.className)}
        >
          {statusCfg.label}
        </Badge>
      }
      actions={
        <Button
          size="sm"
          className="cursor-pointer gap-1.5"
          onClick={() => onClaimRoi?.(id)}
        >
          <FileText className="size-3.5" />
          Claim ROI
        </Button>
      }
      footer={
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          asChild
        >
          <Link href={ESCROW_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
            See Escrow
            <ExternalLink className="size-3" />
          </Link>
        </Button>
      }
      progress={{ label: "Loans Completed", value: loansCompleted }}
    />
  );
}
