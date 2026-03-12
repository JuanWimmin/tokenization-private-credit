"use client";

import { useState, useMemo } from "react";
import { RoiHeader } from "@/features/roi/components/roi-header";
import { CampaignToolbar } from "@/features/roi/components/campaign-toolbar";
import { CampaignList } from "@/features/roi/components/campaign-list";
import { mockCampaigns } from "@/features/roi/data/mock-campaigns";

export default function RoiPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCampaigns = useMemo(() => {
    let list = mockCampaigns;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    if (filter !== "all") {
      list = list.filter((c) => c.status.toLowerCase() === filter);
    }
    return list;
  }, [search, filter]);

  const handleClaimRoi = (campaignId: string) => {
    console.log("Claim ROI:", campaignId);
  };

  return (
    <div className="space-y-6">
      <RoiHeader searchValue={search} onSearchChange={setSearch} />
      <CampaignToolbar filterValue={filter} onFilterChange={setFilter} />
      <CampaignList campaigns={filteredCampaigns} onClaimRoi={handleClaimRoi} />
    </div>
  );
}
