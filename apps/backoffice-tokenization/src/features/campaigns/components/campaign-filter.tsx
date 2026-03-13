"use client";

import type { CampaignStatus } from "@/features/campaigns/types/campaign.types";

const STATUS_OPTIONS: { value: CampaignStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "FUNDRAISING", label: "Recaudando" },
  { value: "ACTIVE", label: "Activa" },
  { value: "CLOSED", label: "Cerrada" },
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
