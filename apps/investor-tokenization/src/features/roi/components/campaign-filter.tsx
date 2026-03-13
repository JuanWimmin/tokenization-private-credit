"use client";

import type { CampaignStatus } from "../types/campaign.types";

const STATUS_OPTIONS: { value: CampaignStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "FUNDRAISING", label: "Fundraising" },
  { value: "ACTIVE", label: "Active" },
  { value: "REPAYMENT", label: "Repayment" },
  { value: "CLAIMABLE", label: "Claimable" },
  { value: "CLOSED", label: "Closed" },
];

interface CampaignFilterProps {
  value: CampaignStatus | "all";
  onChange: (value: CampaignStatus | "all") => void;
}

export function CampaignFilter({ value, onChange }: CampaignFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
