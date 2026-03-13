import {
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import type { PhaseStatus } from "@/features/campaigns/types/campaign.types";

interface PhaseStatusRowProps {
  label: string;
  status: PhaseStatus;
  error?: string;
}

export function PhaseStatusRow({
  label,
  status,
  error,
}: PhaseStatusRowProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      <div className="flex-shrink-0 mt-0.5">
        {status === "loading" && (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        {status === "success" && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        {status === "idle" && (
          <Circle className="h-5 w-5 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex flex-col flex-1">
        <span
          className={`text-sm font-medium ${
            status === "idle" ? "text-muted-foreground/50" : ""
          }`}
        >
          {label}
        </span>
        {error && (
          <span className="text-xs text-destructive mt-1">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
