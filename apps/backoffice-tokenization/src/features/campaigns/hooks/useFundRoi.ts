"use client";

import { useState } from "react";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { signTransaction } from "@tokenization/tw-blocks-shared/src/wallet-kit/wallet-kit";
import { submitAndExtractAddress } from "@/features/campaigns/services/soroban.service";
import { buildUsdcTransferXdr } from "@/features/campaigns/services/transfer.service";

interface UseFundRoiParams {
  onSuccess?: () => void;
}

export function useFundRoi({ onSuccess }: UseFundRoiParams = {}) {
  const { walletAddress } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (vaultContractId: string, amount: number) => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const unsignedXdr = await buildUsdcTransferXdr({
        from: walletAddress,
        to: vaultContractId,
        amount,
      });

      const signedXdr = await signTransaction({
        unsignedTransaction: unsignedXdr,
        address: walletAddress,
      });

      await submitAndExtractAddress(signedXdr);

      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { execute, isSubmitting, error };
}
