export type CampaignStatus = "READY" | "PENDING" | "CLOSED";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  loansCompleted: number;
  minInvestCents: number;
  currency: string;
};
