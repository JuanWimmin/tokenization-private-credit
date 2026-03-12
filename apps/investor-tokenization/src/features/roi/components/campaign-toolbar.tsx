import { CampaignFilter } from "./campaign-filter";

type CampaignToolbarProps = {
  filterValue?: string;
  onFilterChange?: (value: string) => void;
};

export function CampaignToolbar({
  filterValue = "all",
  onFilterChange,
}: CampaignToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <CampaignFilter value={filterValue} onValueChange={onFilterChange} />
    </div>
  );
}
