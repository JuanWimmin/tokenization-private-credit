"use client";

import { Search } from "lucide-react";

interface CampaignSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignSearch({ value, onChange }: CampaignSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
      <input
        type="search"
        placeholder="Buscar campañas..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
