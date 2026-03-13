"use client";

import { useEffect, useRef } from "react";
import { Button } from "@tokenization/ui/button";
import { PhaseStatusRow } from "./phase-status-row";
import type { PhaseState } from "@/features/campaigns/types/campaign.types";

interface Props {
  phases: PhaseState[];
  phaseLabels: string[];
  failedAt: number | null;
  onRun: () => void;
  onRetry: () => void;
}

export function StepCreateToken({
  phases,
  phaseLabels,
  failedAt,
  onRun,
  onRetry,
}: Props) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    onRun();
  }, [onRun]);

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <h2 className="text-xl font-semibold">
        Desplegando contratos y creando campaña
      </h2>
      <div className="flex flex-col gap-3 w-full max-w-md">
        {phases.map((phase, index) => (
          <PhaseStatusRow
            key={index}
            label={phaseLabels[index]!}
            status={phase.status}
            error={phase.error}
          />
        ))}
      </div>
      {failedAt !== null && (
        <Button
          onClick={() => {
            hasTriggered.current = false;
            onRetry();
          }}
          className="cursor-pointer"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
}
