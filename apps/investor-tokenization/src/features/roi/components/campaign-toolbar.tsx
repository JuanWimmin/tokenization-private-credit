"use client";

import { useState } from "react";
import { CampaignSearch } from "./campaign-search";
import { CampaignFilter } from "./campaign-filter";
import type { CampaignStatus } from "../types/campaign.types";

interface CampaignToolbarProps {
  onSearchChange: (value: string) => void;
  onFilterChange: (value: CampaignStatus | "all") => void;
}

export function CampaignToolbar({ onSearchChange, onFilterChange }: CampaignToolbarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleFilterChange = (value: CampaignStatus | "all") => {
    setFilter(value);
    onFilterChange(value);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CampaignFilter value={filter} onChange={handleFilterChange} />
      <div className="w-full sm:max-w-xs">
        <CampaignSearch value={search} onChange={handleSearchChange} />
      </div>
    </div>
  );
}
