import type { Campaign } from "../types/campaign.types";

export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Coffee Producers Cooperative",
    description:
      "Expanding sustainable harvest infrastructure in Antioquia. This project aims to implement water-saving processing systems for 50 local families.",
    status: "ACTIVE",
    loansCompleted: 10,
    minInvestCents: 25000,
    currency: "USD",
    vaultId: null,
  },
  {
    id: "2",
    title: "Artisan Ceramic Collective",
    description:
      "Supporting traditional pottery techniques and new kiln installations. The collective brings together 30 artisans from the region to scale production and reach new markets.",
    status: "ACTIVE",
    loansCompleted: 8,
    minInvestCents: 10000,
    currency: "USD",
    vaultId: null,
  },
  {
    id: "3",
    title: "Urban Agriculture Network",
    description:
      "Rooftop and community garden expansion in Medellín. This initiative creates green jobs and improves food security through urban farming training and shared infrastructure.",
    status: "CLAIMABLE",
    loansCompleted: 12,
    minInvestCents: 50000,
    currency: "USD",
    vaultId: null,
  },
];
