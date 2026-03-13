"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import type { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";
import { ProjectCard } from "./ProjectCard";
import { fetchCampaigns } from "./services/campaign.service";
import type { CampaignFromApi, CampaignStatus } from "./types";

const HIDDEN_STATUSES: CampaignStatus[] = ["DRAFT", "PAUSED"];

interface ProjectListProps {
  search?: string;
  filter?: string;
}

export const ProjectList = ({ search = "", filter = "all" }: ProjectListProps) => {
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();

  const { data: campaigns = [], isLoading: isCampaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const visibleCampaigns = useMemo(
    () => campaigns.filter((c) => !HIDDEN_STATUSES.includes(c.status)),
    [campaigns],
  );

  const escrowIds = useMemo(
    () => visibleCampaigns.map((c) => c.escrowId).filter(Boolean),
    [visibleCampaigns],
  );

  const { data: escrowsList, isLoading: isEscrowsLoading } = useQuery({
    queryKey: ["escrows-by-ids", escrowIds],
    queryFn: async () => {
      const result = await getEscrowByContractIds({
        contractIds: escrowIds,
        validateOnChain: true,
      });
      const list = Array.isArray(result)
        ? result
        : result
          ? [result]
          : [];
      return list as GetEscrowsFromIndexerResponse[];
    },
    enabled: escrowIds.length > 0,
  });

  const escrowsById = useMemo(() => {
    if (!escrowsList || !Array.isArray(escrowsList)) return {};
    return escrowsList.reduce(
      (acc, item, idx) => {
        const key =
          (item as { contractId?: string })?.contractId ?? escrowIds[idx];
        if (key) acc[key] = item;
        return acc;
      },
      {} as Record<string, GetEscrowsFromIndexerResponse>,
    );
  }, [escrowsList, escrowIds]);

  const filteredCampaigns = useMemo(() => {
    return visibleCampaigns.filter((campaign) => {
      if (search) {
        const q = search.toLowerCase();
        const name = (campaign.name ?? "").toLowerCase();
        const desc = (campaign.description ?? "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      if (filter !== "all" && campaign.status !== filter) return false;
      return true;
    });
  }, [search, filter, visibleCampaigns]);

  const isLoading = isCampaignsLoading || isEscrowsLoading;

  if (!isLoading && filteredCampaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-sm">No campaigns available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {isCampaignsLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <ProjectCard
              key={`skeleton-${i}`}
              campaign={{} as CampaignFromApi}
              isLoading
            />
          ))
        : filteredCampaigns.map((campaign) => (
            <ProjectCard
              key={campaign.id}
              campaign={campaign}
              escrow={escrowsById[campaign.escrowId]}
              isLoading={isEscrowsLoading}
            />
          ))}
    </div>
  );
};
