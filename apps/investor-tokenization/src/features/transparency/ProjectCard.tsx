"use client";

import Link from "next/link";
import { Badge } from "@tokenization/ui/badge";
import { Button } from "@tokenization/ui/button";
import { CampaignCard as SharedCampaignCard } from "@tokenization/ui/campaign-card";
import { cn } from "@tokenization/shared/lib/utils";
import { CheckCircle, Circle, ExternalLink, Rocket } from "lucide-react";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import { InvestDialog } from "@/features/tokens/components/InvestDialog";
import { SelectedEscrowProvider } from "@/features/tokens/context/SelectedEscrowContext";
import { CAMPAIGN_STATUS_CONFIG } from "@/features/roi/constants/campaign-status";
import type { CampaignFromApi } from "./types";
import { fromStroops } from "@/utils/adjustedAmounts";

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
  const milestones = (escrow?.milestones ?? []) as MultiReleaseMilestone[];
  const assigned = milestones.reduce((sum, m) => sum + fromStroops(m.amount ?? 0), 0);
  const poolSize = campaign.poolSize ?? 0;

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
              expectedReturn={campaign.expectedReturn}
              loanDuration={campaign.loanDuration}
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
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-foreground">
            USDC {assigned.toLocaleString("en-US", { minimumFractionDigits: 2 })} / USDC {poolSize.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          {campaign.vaultId && (
            <span className="text-[10px] text-muted-foreground font-mono truncate" title={campaign.vaultId}>
              Vault: {campaign.vaultId.slice(0, 8)}...{campaign.vaultId.slice(-4)}
            </span>
          )}
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer p-0 h-auto"
            asChild
          >
            <Link href={escrowExplorerUrl} target="_blank" rel="noopener noreferrer">
              See Escrow
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      }
      progress={{ label: "Loans Completed", value: progress }}
    >
      {milestones.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {milestones.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              {m.status === "Approved" ? (
                <CheckCircle className="size-3.5 text-green-500 shrink-0" />
              ) : (
                <Circle className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{m.description || `Milestone ${i + 1}`}</span>
              <span className="ml-auto font-medium">{fromStroops(m.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC</span>
            </li>
          ))}
        </ul>
      ) : null}
    </SharedCampaignCard>
  );
};
