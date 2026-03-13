"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@tokenization/ui/dialog";
import { Button } from "@tokenization/ui/button";
import { Input } from "@tokenization/ui/input";
import { Label } from "@tokenization/ui/label";
import { Loader2 } from "lucide-react";
import { useFundRoi } from "@/features/campaigns/hooks/useFundRoi";
import { toast } from "sonner";

interface FundRoiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  vaultId: string;
  onFunded: () => void;
}

export function FundRoiDialog({
  open,
  onOpenChange,
  campaignName,
  vaultId,
  onFunded,
}: FundRoiDialogProps) {
  const [amount, setAmount] = useState("");

  const { execute, isSubmitting, error } = useFundRoi({
    onSuccess: () => {
      toast.success("Vault funded successfully");
      onFunded();
      onOpenChange(false);
      setAmount("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    execute(vaultId, parsed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full! sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Fund ROI — {campaignName}</DialogTitle>
          <DialogDescription>
            Transfer USDC to the vault so investors can claim their returns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="fundAmount">Amount (USDC)</Label>
            <Input
              id="fundAmount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Vault:{" "}
            <span className="font-mono text-foreground">{vaultId}</span>
          </p>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting || !amount}
            className="w-full cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Funding Vault...</span>
              </div>
            ) : (
              "Fund Vault"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
