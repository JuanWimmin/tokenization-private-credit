import { Bell } from "lucide-react";
import { CampaignSearch } from "./campaign-search";
import { cn } from "@/lib/utils";

type RoiHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
};

export function RoiHeader({
  searchValue,
  onSearchChange,
  className,
}: RoiHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Invest in Campaigns
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse and support local entrepreneurship projects.
        </p>
      </div>
      <div className="flex flex-row items-center gap-2 shrink-0">
        <CampaignSearch
          value={searchValue}
          onChange={onSearchChange}
          className="max-w-[220px] sm:max-w-[260px]"
        />
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
      </div>
    </div>
  );
}
