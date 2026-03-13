"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/features/campaigns/services/campaigns.api";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: getCampaigns,
  });
}
