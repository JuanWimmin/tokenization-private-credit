export type MilestoneStatus = "active" | "completed";

export interface Milestone {
  id: string;
  description: string;
  walletAddress: string;
  amount: number;
  status: MilestoneStatus;
}

export interface AddMilestoneFormValues {
  description: string;
  amount: number;
}
