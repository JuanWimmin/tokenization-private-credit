export type CampaignStatus =
  | "DRAFT"
  | "FUNDRAISING"
  | "ACTIVE"
  | "REPAYMENT"
  | "CLAIMABLE"
  | "CLOSED"
  | "PAUSED";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  issuerAddress: string;
  escrowId: string;
  poolSize: number;
  loanDuration: number;
  expectedReturn: number;
  loanSize: number;
  vaultId: string | null;
  tokenSaleId: string | null;
  tokenFactoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignFormValues {
  name: string;
  description: string;
  poolSize: number;
  loanDuration: number;
  expectedReturn: number;
  loanSize: number;
  tokenName: string;
}

export type PhaseStatus = "idle" | "loading" | "success" | "error";

export interface PhaseState {
  status: PhaseStatus;
  error: string;
}
