import { useState } from "react";
import type { Campaign } from "@/features/campaigns/types/campaign.types";

export function useRoi() {
  const [fundsDialogCampaign, setFundsDialogCampaign] = useState<Campaign | null>(null);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);

  function openFundsDialog(campaign: Campaign) {
    setFundsDialogCampaign(campaign);
    setFundDialogOpen(true);
  }

  function closeFundsDialog() {
    setFundDialogOpen(false);
    setFundsDialogCampaign(null);
  }

  return {
    fundsDialogCampaign,
    fundDialogOpen,
    openFundsDialog,
    closeFundsDialog,
  };
}
