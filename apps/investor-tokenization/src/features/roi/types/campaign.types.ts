export type CampaignStatus =
  | "DRAFT"
  | "FUNDRAISING"
  | "ACTIVE"
  | "REPAYMENT"
  | "CLAIMABLE"
  | "CLOSED"
  | "PAUSED";

export type CampaignFromApi = {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  previousStatus: CampaignStatus | null;
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
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  loansCompleted: number;
  investedAmount: number;
  currency: string;
  vaultId: string | null;
};
