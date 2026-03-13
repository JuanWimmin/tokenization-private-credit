"use client";

import { useEffect, useRef } from "react";
import { Button } from "@tokenization/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  escrowStatus: "idle" | "loading" | "success" | "error";
  escrowContractId: string | null;
  escrowError: string | null;
  onInitialize: () => void;
  onRetry: () => void;
  onNext: () => void;
}

export function StepEscrowConfig({
  escrowStatus,
  escrowContractId,
  escrowError,
  onInitialize,
  onRetry,
  onNext,
}: Props) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    if (escrowStatus === "success") return;
    hasTriggered.current = true;
    onInitialize();
  }, [onInitialize, escrowStatus]);

  if (escrowStatus === "idle" || escrowStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Inicializando escrow...
        </p>
      </div>
    );
  }

  if (escrowStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold text-destructive">
          Error al inicializar escrow
        </p>
        {escrowError && (
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {escrowError}
          </p>
        )}
        <Button
          onClick={() => {
            hasTriggered.current = false;
            onRetry();
          }}
          className="cursor-pointer mt-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <p className="text-lg font-semibold">
        Escrow inicializado exitosamente
      </p>
      <Button
        onClick={onNext}
        className="cursor-pointer mt-4"
      >
        Continuar
      </Button>
    </div>
  );
}
