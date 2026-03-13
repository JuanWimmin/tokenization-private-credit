"use client";

import { Button } from "@tokenization/ui/button";
import { Loader2, Power } from "lucide-react";
import { useToggleVault } from "@/features/campaigns/hooks/useToggleVault";
import { toast } from "sonner";

interface ToggleVaultButtonProps {
  vaultId: string;
  currentlyEnabled: boolean | null;
  campaignId?: string;
  onToggled: (newEnabled: boolean) => void;
}

export function ToggleVaultButton({
  vaultId,
  currentlyEnabled,
  onToggled,
}: ToggleVaultButtonProps) {
  const nextState = !currentlyEnabled;

  const { execute, isSubmitting, error } = useToggleVault({
    onSuccess: () => {
      toast.success(
        currentlyEnabled ? "Vault disabled" : "Vault enabled",
      );
      onToggled(nextState);
    },
  });

  return (
    <>
      <Button
        size="sm"
        variant={currentlyEnabled ? "destructive" : "outline"}
        className="cursor-pointer h-8"
        disabled={isSubmitting || currentlyEnabled === null}
        onClick={() => execute(vaultId, nextState)}
      >
        {isSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Power className="h-3.5 w-3.5 mr-1" />
            {currentlyEnabled ? "Disable" : "Enable"}
          </>
        )}
      </Button>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </>
  );
}
