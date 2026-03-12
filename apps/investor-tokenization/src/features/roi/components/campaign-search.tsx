"use client";

import { Input } from "@tokenization/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignSearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function CampaignSearch({
  value,
  onChange,
  placeholder = "Search campaigns...",
  className,
}: CampaignSearchProps) {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9 rounded-lg border-input bg-background text-sm"
        aria-label="Search campaigns"
      />
    </div>
  );
}
