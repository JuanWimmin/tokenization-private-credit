"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@tokenization/ui/badge";
import { Button } from "@tokenization/ui/button";
import { CampaignCard as SharedCampaignCard } from "@tokenization/ui/campaign-card";
import { cn } from "@tokenization/shared/lib/utils";
import { Landmark } from "lucide-react";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import type { MultiReleaseMilestone } from "@trustless-work/escrow/types";
import type { Campaign } from "@/features/campaigns/types/campaign.types";
import { CAMPAIGN_STATUS_CONFIG } from "@/features/campaigns/constants/campaign-status";
import { formatCurrency } from "@/lib/utils";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { id, name, description, status, escrowId } = campaign;

  const statusCfg = CAMPAIGN_STATUS_CONFIG[status];
  const isDraft = status === "DRAFT";

  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();

  const { data: escrowData } = useQuery({
    queryKey: ["escrow", escrowId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: async () => {
      const data = (await getEscrowByContractIds({
        contractIds: [escrowId],
        validateOnChain: true,
      })) as any;
      return data?.[0] ?? null;
    },
    enabled: !isDraft && !!escrowId,
    staleTime: 1000 * 60 * 5,
  });

  const milestones = (escrowData?.milestones ?? []) as MultiReleaseMilestone[];
  const assigned = milestones.reduce((sum, m) => sum + Number(m.amount ?? 0), 0);
  const progressValue = campaign.poolSize > 0 ? Math.min(100, (assigned / campaign.poolSize) * 100) : 0;

  return (
    <SharedCampaignCard
      title={`#${id.slice(0, 3).toUpperCase()} ${name}`}
      description={description ?? ""}
      statusBadge={
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold uppercase tracking-wide", statusCfg.className)}
        >
          {statusCfg.label}
        </Badge>
      }
      actions={
        !isDraft ? (
          <Button size="sm" className="cursor-pointer gap-1.5" asChild>
            <Link href={`/campaigns/loans/${escrowId}`}>
              <Landmark className="size-3.5" />
              Manejar Préstamos
            </Link>
          </Button>
        ) : undefined
      }
      footer={
        <span className="text-xs font-bold text-foreground">
          USDC {formatCurrency(assigned)} / USDC {formatCurrency(campaign.poolSize)}
        </span>
      }
      progress={{ label: "Dinero asignado", value: progressValue }}
    />
  );
}
