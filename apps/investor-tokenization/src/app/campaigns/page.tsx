"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { CampaignToolbar } from "@/features/roi/components/campaign-toolbar";
import { ProjectList } from "@/features/transparency/ProjectList";
import type { CampaignStatus } from "@/features/roi/types/campaign.types";

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Campaigns"
        description="Browse and support local entrepreneurship projects."
      />
      <CampaignToolbar
        onSearchChange={setSearch}
        onFilterChange={setFilter}
      />
      <ProjectList search={search} filter={filter} />
    </div>
  );
}
