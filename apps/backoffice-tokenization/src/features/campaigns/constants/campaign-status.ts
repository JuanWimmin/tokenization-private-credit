import type { CampaignStatus } from "@/features/campaigns/types/campaign.types";

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Borrador", className: "bg-secondary text-text-muted border-border" },
  FUNDRAISING: { label: "Recaudando", className: "bg-blue-50 text-blue-600 border-blue-200" },
  ACTIVE: { label: "Activa", className: "bg-success-bg text-success border-success/30" },
  REPAYMENT: { label: "En Pago", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CLAIMABLE: { label: "Reclamable", className: "bg-purple-50 text-purple-700 border-purple-200" },
  CLOSED: { label: "Cerrada", className: "bg-secondary text-text-muted border-border" },
  PAUSED: { label: "Pausada", className: "bg-orange-50 text-orange-700 border-orange-200" },
};
