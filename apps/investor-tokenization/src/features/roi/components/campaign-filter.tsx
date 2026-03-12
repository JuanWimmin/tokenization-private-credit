"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tokenization/ui/select";
import { cn } from "@/lib/utils";

const filterOptions = [
  { value: "all", label: "All Campaigns" },
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

type CampaignFilterProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export function CampaignFilter({
  value = "all",
  onValueChange,
  className,
}: CampaignFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "w-[180px] rounded-lg border border-input bg-background h-9 text-sm font-medium text-black",
          className
        )}
      >
        <SelectValue placeholder="All Campaigns" />
      </SelectTrigger>
      <SelectContent align="start">
        {filterOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
