"use client";

import { useState, useMemo, useCallback } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { CampaignToolbar } from "@/features/roi/components/campaign-toolbar";
import { CampaignList } from "@/features/roi/components/campaign-list";
import type { Campaign, CampaignStatus } from "@/features/roi/types/campaign.types";
import { useUserInvestments } from "@/features/investments/hooks/useUserInvestments.hook";
import type { InvestmentFromApi } from "@/features/investments/services/investment.service";
import { ClaimROIService } from "@/features/claim-roi/services/claim.service";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { signTransaction } from "@tokenization/tw-blocks-shared/src/wallet-kit/wallet-kit";
import { SendTransactionService } from "@/lib/sendTransactionService";
import { toastSuccessWithTx } from "@/lib/toastWithTx";
import { toast } from "sonner";

function toCampaign(inv: InvestmentFromApi): Campaign {
  return {
    id: inv.campaign.id,
    title: inv.campaign.name,
    description: inv.campaign.description ?? "",
    status: inv.campaign.status as CampaignStatus,
    loansCompleted: 0,
    minInvestCents: Number(inv.usdcAmount) * 100,
    currency: "USD",
    vaultId: inv.campaign.vaultId ?? null,
  };
}

function deduplicateByCampaign(investments: InvestmentFromApi[]): Campaign[] {
  const seen = new Set<string>();
  const campaigns: Campaign[] = [];
  for (const inv of investments) {
    if (!seen.has(inv.campaign.id)) {
      seen.add(inv.campaign.id);
      campaigns.push(toCampaign(inv));
    }
  }
  return campaigns;
}

export default function MyInvestmentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const { data: investments, isLoading } = useUserInvestments();
  const { walletAddress } = useWalletContext();

  const campaigns = useMemo(
    () => deduplicateByCampaign(investments ?? []),
    [investments],
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = filter === "all" || c.status === filter;
      const matchesSearch =
        search.trim() === "" ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, search, filter]);

  const handleClaimRoi = useCallback(
    async (campaignId: string) => {
      const campaign = campaigns.find((c) => c.id === campaignId);

      if (!campaign?.vaultId) {
        toast.error("Vault contract not available for this campaign.");
        return;
      }

      if (!walletAddress) {
        toast.error("Please connect your wallet to claim ROI.");
        return;
      }

      try {
        const svc = new ClaimROIService();
        const claimResponse = await svc.claimROI({
          vaultContractId: campaign.vaultId,
          beneficiaryAddress: walletAddress,
        });

        if (!claimResponse?.success || !claimResponse?.xdr) {
          throw new Error(
            claimResponse?.message ?? "Failed to build claim transaction.",
          );
        }

        const signedTxXdr = await signTransaction({
          unsignedTransaction: claimResponse.xdr,
          address: walletAddress,
        });

        const sender = new SendTransactionService();
        const submitResponse = await sender.sendTransaction({
          signedXdr: signedTxXdr,
        });

        if (submitResponse.status !== "SUCCESS") {
          throw new Error(
            submitResponse.message ?? "Transaction submission failed.",
          );
        }

        toastSuccessWithTx("ROI claimed successfully!", submitResponse.hash);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error while claiming ROI.";
        toast.error(msg);
      }
    },
    [campaigns, walletAddress],
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="My Investments"
        description="Track your active investments and claim your returns."
      />
      <CampaignToolbar
        onSearchChange={setSearch}
        onFilterChange={setFilter}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading your investments...
        </p>
      ) : (
        <CampaignList campaigns={filteredCampaigns} onClaimRoi={handleClaimRoi} />
      )}
    </div>
  );
}
