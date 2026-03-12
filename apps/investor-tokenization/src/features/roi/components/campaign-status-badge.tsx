import { Badge } from "@tokenization/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignStatusBadgeProps = {
  status: string;
  className?: string;
};

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-md bg-emerald-500 text-white border-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide gap-1 [&_svg]:size-3",
        className
      )}
    >
      <Check className="size-3" />
      {status}
    </Badge>
  );
}
