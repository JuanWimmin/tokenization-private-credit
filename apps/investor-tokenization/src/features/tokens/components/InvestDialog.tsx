"use client";

import React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@tokenization/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@tokenization/ui/form";
import { Input } from "@tokenization/ui/input";
import { Button } from "@tokenization/ui/button";
import { Rocket, Info } from "lucide-react";
import {
  TokenService,
  type BuyTokenPayload,
} from "@/features/tokens/services/token.service";
import { SendTransactionService } from "@/lib/sendTransactionService";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { signTransaction } from "@tokenization/tw-blocks-shared/src/wallet-kit/wallet-kit";
import { useSelectedEscrow } from "@/features/tokens/context/SelectedEscrowContext";
import { createInvestment } from "@/features/investments/services/investment.service";
import { MultiReleaseMilestone } from "@trustless-work/escrow";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fromStroops } from "@/utils/adjustedAmounts";
import axios from "axios";

type InvestFormValues = {
  amount: number;
};

interface InvestDialogProps {
  tokenSaleContractId: string;
  triggerLabel?: string;
  expectedReturn?: number;
  loanDuration?: number;
}

const DEFAULT_USDC_ADDRESS = process.env.NEXT_PUBLIC_DEFAULT_USDC_ADDRESS ?? "";

export function InvestDialog({
  tokenSaleContractId,
  triggerLabel = "Invest",
  expectedReturn = 8.5,
  loanDuration = 12,
}: InvestDialogProps) {
  const { walletAddress } = useWalletContext();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const selected = useSelectedEscrow();
  const queryClient = useQueryClient();

  const form = useForm<InvestFormValues>({
    defaultValues: { amount: 0 },
    mode: "onChange",
  });

  const onSubmit = async (values: InvestFormValues) => {
    setErrorMessage(null);
    if (!walletAddress) {
      setErrorMessage("Please connect your wallet to continue.");
      return;
    }
    if (!tokenSaleContractId) {
      setErrorMessage("Missing token sale contract id.");
      return;
    }
    if (!values.amount || values.amount <= 0) {
      setErrorMessage("Enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      // Ensure USDC trustline exists before buying
      const trustlineRes = await axios.post("/api/trustline/add", {
        address: walletAddress,
      });

      if (trustlineRes.data?.success && trustlineRes.data?.xdr) {
        const signedTrustlineTx = await signTransaction({
          unsignedTransaction: trustlineRes.data.xdr,
          address: walletAddress,
        });
        const sender = new SendTransactionService();
        const trustlineResult = await sender.sendTransaction({
          signedXdr: signedTrustlineTx,
        });
        if (trustlineResult.status !== "SUCCESS") {
          throw new Error(
            trustlineResult.message ?? "Failed to add USDC trustline.",
          );
        }
      }

      const tokenService = new TokenService();

      const payload: BuyTokenPayload = {
        tokenSaleContractId,
        usdcAddress: DEFAULT_USDC_ADDRESS,
        payerAddress: walletAddress,
        beneficiaryAddress: walletAddress,
        amount: values.amount,
      };

      const buyResponse = await tokenService.buyToken(payload);

      if (!buyResponse?.success || !buyResponse?.xdr) {
        throw new Error(
          buyResponse?.message ?? "Failed to build buy transaction."
        );
      }

      const signedTxXdr = await signTransaction({
        unsignedTransaction: buyResponse.xdr,
        address: walletAddress,
      });

      const sender = new SendTransactionService();
      const submitResponse = await sender.sendTransaction({
        signedXdr: signedTxXdr,
      });

      if (submitResponse.status !== "SUCCESS") {
        throw new Error(
          submitResponse.message ?? "Transaction submission failed."
        );
      }

      if (selected.campaignId && submitResponse.hash) {
        try {
          await createInvestment({
            campaignId: selected.campaignId,
            investorAddress: walletAddress,
            usdcAmount: values.amount,
            tokenAmount: values.amount,
            txHash: submitResponse.hash,
          });
        } catch (dbError) {
          console.error("Failed to save investment to database:", dbError);
        }
      }

      // Refresh the escrow balance using TanStack Query
      const balanceQueryKey = ["escrows", [selected.escrowId]] as const;
      const singleEscrowKey = ["escrow", selected.escrowId] as const;

      // Balance used by BalanceProgressBar
      await queryClient.invalidateQueries({ queryKey: balanceQueryKey });
      await queryClient.refetchQueries({ queryKey: balanceQueryKey });

      // Escrow details (per-card) used by the Carousel modal content
      await queryClient.invalidateQueries({ queryKey: singleEscrowKey });
      await queryClient.refetchQueries({ queryKey: singleEscrowKey });

      // Escrows list (bulk fetch) used by the Carousel (partial match)
      await queryClient.invalidateQueries({ queryKey: ["escrows-by-ids"] });
      await queryClient.refetchQueries({ queryKey: ["escrows-by-ids"] });

      toast.success("Investment completed successfully.");
      form.reset({ amount: 0 });
      setOpen(false);
    } catch (err) {
      let message =
        err instanceof Error
          ? err.message
          : "Unexpected error while processing your investment.";

      // Check if error is due to insufficient USDC balance
      if (
        message.includes("resulting balance is not within the allowed range") ||
        message.includes("balance is not within") ||
        message.includes("insufficient balance")
      ) {
        message = "Insufficient USDC balance. Please ensure your wallet has enough USDC to complete this transaction. You can get testnet USDC from a Stellar testnet faucet.";
      }

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = React.useMemo(() => {
    if (!selected.escrow || selected.escrow.type !== "multi-release") return 0;

    const milestones = selected.escrow.milestones as MultiReleaseMilestone[];

    return milestones.reduce((acc, milestone) => acc + fromStroops(milestone.amount ?? 0), 0);
  }, [selected.escrow?.milestones]);

  const currency = selected.escrow?.trustline?.symbol ?? "USDC";

  const yieldRate = expectedReturn / 100;
  const watchedAmount = form.watch("amount");
  const safeAmount =
    typeof watchedAmount === "number" && !Number.isNaN(watchedAmount) && watchedAmount > 0
      ? watchedAmount
      : 0;
  const estimatedReturn = safeAmount * yieldRate;
  const totalAtMaturity = safeAmount + estimatedReturn;

  const isSubmitDisabled =
    submitting ||
    !form.watch("amount") ||
    Number.isNaN(form.watch("amount")) ||
    form.watch("amount") <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer gap-1.5">
          <Rocket className="size-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogTitle className="sr-only">Invest</DialogTitle>
        <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-base font-semibold">
                      Amount (USDC)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-14 text-xl pr-20 rounded-xl border-muted bg-muted/30"
                          {...field}
                          value={
                            Number.isNaN(field.value as number) ||
                              field.value === ("" as unknown as number)
                              ? ""
                              : String(field.value)
                          }
                          onChange={(e) => {
                            const next =
                              e.target.value === ""
                                ? ("" as unknown as number)
                                : Number(e.target.value);
                            field.onChange(next);
                          }}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-cyan-500">
                          USDC
                        </span>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Available balance:{" "}
                      <span className="font-medium">
                        {totalAmount > 0
                          ? `${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`
                          : `0.00 ${currency}`}
                      </span>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-muted/30 px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimated Yield
                  </span>
                  <p className="mt-1 text-lg font-bold text-teal-600">
                    {expectedReturn}% APY
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Term Length
                  </span>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loanDuration} Months
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-linear-to-br from-teal-50 to-cyan-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your investment</span>
                  <span className="text-sm font-semibold text-foreground">
                    {safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Estimated return ({expectedReturn}% &times; {loanDuration}mo)
                  </span>
                  <span className="text-sm font-semibold text-teal-600">
                    +{estimatedReturn.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className="border-t border-teal-200 pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total at maturity</span>
                  <span className="text-lg font-bold text-teal-700">
                    {totalAtMaturity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Disclaimer:</span> Please
                  review your investment amount carefully. Once confirmed, these
                  amounts are not editable and the transaction is final.
                </p>
              </div>

              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-12 w-full rounded-xl bg-cyan-500 text-base font-semibold text-white hover:bg-cyan-600"
              >
                {submitting ? "Processing..." : "Confirm Investment"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By clicking confirm, you agree to the Terms of Service and
                Investment Agreement.
              </p>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
