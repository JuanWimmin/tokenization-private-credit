"use client";

import Link from "next/link";
import { Badge } from "@tokenization/ui/badge";
import { Button } from "@tokenization/ui/button";
import { CampaignCard as SharedCampaignCard } from "@tokenization/ui/campaign-card";
import { cn } from "@tokenization/shared/lib/utils";
import { ExternalLink, Rocket } from "lucide-react";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import { InvestDialog } from "@/features/tokens/components/InvestDialog";
import { SelectedEscrowProvider } from "@/features/tokens/context/SelectedEscrowContext";
import { CAMPAIGN_STATUS_CONFIG } from "@/features/roi/constants/campaign-status";
import type { CampaignFromApi } from "./types";

export type ProjectCardProps = {
  campaign: CampaignFromApi;
  escrow?: Escrow;
  isLoading?: boolean;
};

function getLoansCompleted(escrow: Escrow | undefined): number {
  if (!escrow?.milestones) return 0;
  const milestones = escrow.milestones as MultiReleaseMilestone[];
  return milestones.filter((m) => m.status === "Approved").length;
}

function getTotalMilestones(escrow: Escrow | undefined): number {
  if (!escrow?.milestones) return 0;
  return (escrow.milestones as MultiReleaseMilestone[]).length;
}

function getProgress(escrow: Escrow | undefined): number {
  const total = getTotalMilestones(escrow);
  if (total === 0) return 0;
  return Math.min((getLoansCompleted(escrow) / total) * 100, 100);
}

function LoadingSkeleton() {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        "shadow-card",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="flex items-end justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export const ProjectCard = ({
  campaign,
  escrow,
  isLoading = false,
}: ProjectCardProps) => {
  const { name, description, status, escrowId, tokenSaleId } = campaign;
  const progress = getProgress(escrow);
  const statusCfg = CAMPAIGN_STATUS_CONFIG[status];
  const escrowExplorerUrl = `https://stellar.expert/explorer/testnet/contract/${escrowId}`;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <SharedCampaignCard
      title={`#${campaign.id.slice(0, 3).toUpperCase()} ${name}`}
      description={description || "No description"}
      statusBadge={
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold uppercase tracking-wide", statusCfg.className)}
        >
          {statusCfg.label}
        </Badge>
      }
      actions={
        tokenSaleId ? (
          <SelectedEscrowProvider
            value={{
              escrow,
              escrowId,
              tokenSaleContractId: tokenSaleId,
              campaignId: campaign.id,
            }}
          >
            <InvestDialog
              tokenSaleContractId={tokenSaleId}
              triggerLabel="Invest"
            />
          </SelectedEscrowProvider>
        ) : (
          <Button size="sm" className="cursor-pointer gap-1.5" disabled>
            <Rocket className="size-3.5" />
            Invest
          </Button>
        )
      }
      footer={
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          asChild
        >
          <Link href={escrowExplorerUrl} target="_blank" rel="noopener noreferrer">
            See Escrow
            <ExternalLink className="size-3" />
          </Link>
        </Button>
      }
      progress={{ label: "Loans Completed", value: progress }}
    />
  );
};
