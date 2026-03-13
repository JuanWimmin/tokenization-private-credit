"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@tokenization/ui/dialog";
import { Button } from "@tokenization/ui/button";
import { Progress } from "@tokenization/ui/progress";
import { Landmark, Zap } from "lucide-react";
import { mapCampaignProgress } from "@/features/campaigns/utils/campaign.mapper";
import type { AddFundsDialogProps } from "./types";

export function AddFundsDialog({
  campaign,
  onClose,
  onFundNow,
}: AddFundsDialogProps) {
  const progress = campaign ? mapCampaignProgress(campaign) : 0;

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 pt-4 pb-2">
          {/* Icon + progress */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center size-20 rounded-full bg-primary">
              <Landmark className="size-9 text-primary-foreground" />
            </div>
            <Progress value={progress} className="h-1.5 w-32" />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Fondear Campaña #{campaign?.id.slice(0, 3).toUpperCase()}{" "}
              {campaign?.name}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              El fondeo se puede realizar directamente desde el panel de la
              plataforma o integrarse a través de nuestro SDK para flujos de
              trabajo automatizados. Asegúrese de que su cuenta esté verificada
              antes de continuar.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onFundNow}
            size="lg"
            className="cursor-pointer gap-2 rounded-xl px-8"
          >
            <Zap className="size-4" />
            Fondear Ahora
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="cursor-pointer w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
