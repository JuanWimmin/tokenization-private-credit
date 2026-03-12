"use client";

import { Button } from "@tokenization/ui/button";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ClaimRoiButtonProps = {
  campaignId: string;
  className?: string;
  onClick?: (campaignId: string) => void;
};

export function ClaimRoiButton({
  campaignId,
  className,
  onClick,
}: ClaimRoiButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "bg-cyan-600 hover:bg-cyan-700 text-white font-semibold uppercase tracking-wide text-xs rounded-md h-9 px-4 gap-2 shrink-0",
        className
      )}
      onClick={() => onClick?.(campaignId)}
    >
      <FileText className="size-4" />
      Claim ROI
    </Button>
  );
}
