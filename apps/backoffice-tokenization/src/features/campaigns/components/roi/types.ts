import type { UseFormReturn } from "react-hook-form";
import type { Campaign } from "@/features/campaigns/types/campaign.types";

export interface RoiFormValues {
  roiPercentage: number;
}

export interface RoiTableProps {
  campaigns: Campaign[];
  onAddFunds: (campaign: Campaign) => void;
}

export interface RoiTableRowProps {
  campaign: Campaign;
  balance: number;
  onAddFunds: (campaign: Campaign) => void;
}

export interface CreateRoiDialogProps {
  campaign: Campaign | null;
  form: UseFormReturn<RoiFormValues>;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface AddFundsDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
  onFundNow: () => void;
}
