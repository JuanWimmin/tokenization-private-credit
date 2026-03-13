"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tokenization/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@tokenization/ui/dialog";
import { Input } from "@tokenization/ui/input";
import { Textarea } from "@tokenization/ui/textarea";
import { Button } from "@tokenization/ui/button";
import { CheckCircle2, Pencil, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { useEscrowsMutations } from "@tokenization/tw-blocks-shared/src/tanstack/useEscrowsMutations";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import {
  MultiReleaseMilestone,
  MultiReleaseReleaseFundsPayload,
  ApproveMilestonePayload,
  UpdateMultiReleaseEscrowPayload,
} from "@trustless-work/escrow/types";
import {
  ErrorResponse,
  handleError,
} from "@tokenization/tw-blocks-shared/src/handle-errors/handle";
import { useEscrowContext } from "@tokenization/tw-blocks-shared/src/providers/EscrowProvider";
import { useChangeMilestoneStatus } from "@tokenization/tw-blocks-shared/src/escrows/single-multi-release/change-milestone-status/dialog/useChangeMilestoneStatus";
import { numericInputKeyDown, parseNumericInput } from "@/lib/numeric-input";
import { formatCurrency } from "@/lib/utils";

const addMilestoneSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria"),
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
});

type AddMilestoneFormValues = z.infer<typeof addMilestoneSchema>;

interface ManageLoansViewProps {
  contractId: string;
}

export function ManageLoansView({ contractId }: ManageLoansViewProps) {
  const { walletAddress } = useWalletContext();
  const { releaseFunds, approveMilestone, updateEscrow } = useEscrowsMutations();
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();
  const { selectedEscrow, setSelectedEscrow } = useEscrowContext();
  const changeMilestoneStatusHook = useChangeMilestoneStatus();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasingIndex, setReleasingIndex] = useState<number | null>(null);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [changeStatusOpenIndex, setChangeStatusOpenIndex] = useState<number | null>(null);
  const [addingLoan, setAddingLoan] = useState(false);

  const form = useForm<AddMilestoneFormValues>({
    resolver: zodResolver(addMilestoneSchema),
    defaultValues: { description: "", amount: "" as unknown as number },
    mode: "onChange",
  });

  const fetchEscrow = useCallback(
    async (escrowId: string) => {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await getEscrowByContractIds({
          contractIds: [escrowId],
          validateOnChain: true,
        })) as any;
        if (!data || !data[0]) throw new Error("Escrow no encontrado");
        setSelectedEscrow(data[0]);
      } catch (err) {
        setError(handleError(err as ErrorResponse).message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    fetchEscrow(contractId);
  }, [contractId, fetchEscrow]);

  const handleApprove = async (milestoneIndex: number) => {
    if (!walletAddress || !selectedEscrow?.contractId) return;
    setApprovingIndex(milestoneIndex);
    try {
      const payload: ApproveMilestonePayload = {
        contractId: selectedEscrow.contractId,
        milestoneIndex: String(milestoneIndex),
        approver: walletAddress,
      };
      await approveMilestone.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress,
      });
      toast.success(`Préstamo ${milestoneIndex + 1} aprobado`);
      await fetchEscrow(selectedEscrow.contractId);
    } catch (err) {
      toast.error(handleError(err as ErrorResponse).message);
    } finally {
      setApprovingIndex(null);
    }
  };

  const handleRelease = async (milestoneIndex: number) => {
    if (!walletAddress || !selectedEscrow?.contractId) return;
    setReleasingIndex(milestoneIndex);
    try {
      const payload: MultiReleaseReleaseFundsPayload = {
        contractId: selectedEscrow.contractId,
        releaseSigner: walletAddress,
        milestoneIndex: String(milestoneIndex),
      };
      await releaseFunds.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress,
      });
      toast.success(`Fondos del préstamo ${milestoneIndex + 1} liberados`);
      await fetchEscrow(selectedEscrow.contractId);
    } catch (err) {
      toast.error(handleError(err as ErrorResponse).message);
    } finally {
      setReleasingIndex(null);
    }
  };

  const handleOpenChangeStatus = (milestoneIndex: number) => {
    changeMilestoneStatusHook.form.setValue("milestoneIndex", String(milestoneIndex));
    setChangeStatusOpenIndex(milestoneIndex);
  };

  const handleAddLoan = form.handleSubmit(async (data) => {
    if (!walletAddress || !selectedEscrow?.contractId) return;
    setAddingLoan(true);
    try {
      const existingMilestones = (
        (selectedEscrow.milestones || []) as MultiReleaseMilestone[]
      ).map((m, i) => ({
        description: m.description,
        amount: typeof m.amount === "string" ? Number(m.amount) : m.amount,
        receiver: (m as MultiReleaseMilestone & { receiver?: string }).receiver || "",
        evidence: selectedEscrow.milestones?.[i]?.evidence || "",
        status: selectedEscrow.milestones?.[i]?.status || "",
      }));

      const payload: UpdateMultiReleaseEscrowPayload = {
        contractId: selectedEscrow.contractId,
        signer: walletAddress,
        escrow: {
          engagementId: selectedEscrow.engagementId,
          title: selectedEscrow.title,
          description: selectedEscrow.description,
          platformFee:
            typeof selectedEscrow.platformFee === "string"
              ? Number(selectedEscrow.platformFee)
              : selectedEscrow.platformFee,
          trustline: {
            address: selectedEscrow.trustline?.address || "",
            symbol: "USDC",
          },
          roles: {
            approver: selectedEscrow.roles?.approver || "",
            serviceProvider: selectedEscrow.roles?.serviceProvider || "",
            platformAddress: selectedEscrow.roles?.platformAddress || "",
            releaseSigner: selectedEscrow.roles?.releaseSigner || "",
            disputeResolver: selectedEscrow.roles?.disputeResolver || "",
          },
          milestones: [
            ...existingMilestones,
            { description: data.description, amount: data.amount, receiver: walletAddress, evidence: "", status: "" },
          ],
        },
      };

      await updateEscrow.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress,
      });

      toast.success("Préstamo agregado exitosamente");
      form.reset();
      await fetchEscrow(selectedEscrow.contractId);
    } catch (err) {
      toast.error(handleError(err as ErrorResponse).message);
    } finally {
      setAddingLoan(false);
    }
  });

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !selectedEscrow) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive text-sm">
        {error || "Escrow no encontrado"}
      </div>
    );
  }

  const milestones = (selectedEscrow.milestones || []) as MultiReleaseMilestone[];
  const escrowBalance = Number(selectedEscrow.balance || 0);

  return (
    <div className="flex flex-col gap-8 mx-auto w-full">
      {/* Milestones list */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Beneficiarios
        </p>

        {milestones.length === 0 ? (
          <p className="text-sm text-text-muted">No hay hitos registrados.</p>
        ) : (
          milestones.map((milestone, index) => {
            const isApproved = milestone.flags?.approved === true;
            const isReleased = milestone.flags?.released === true;
            const milestoneAmount = Number(milestone.amount || 0);
            const insufficientFunds = escrowBalance < milestoneAmount;


            return (
              <div
                key={index}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                  isReleased
                    ? "border-border bg-secondary/20 opacity-60"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-sm font-medium ${isReleased ? "line-through text-text-muted" : "text-foreground"}`}
                  >
                    {milestone.description}
                  </span>
                  {milestone.status && (
                    <span className="text-xs text-text-muted">
                      Estado: {milestone.status}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold ${isReleased ? "text-text-muted" : "text-primary"}`}
                  >
                    USDC {formatCurrency(milestoneAmount)}
                  </span>
                </div>

                {isReleased ? (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>Desembolsado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Edit → change status */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenChangeStatus(index)}
                      className="cursor-pointer text-text-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </Button>

                    {isApproved ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleRelease(index)}
                        disabled={isReleased || releasingIndex !== null || insufficientFunds}
                        className="text-xs uppercase tracking-wide cursor-pointer"
                        title={insufficientFunds ? "Fondos insuficientes en el escrow" : undefined}
                      >
                        {releasingIndex === index ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Desembolsar"
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApprove(index)}
                        disabled={approvingIndex !== null}
                        className="text-xs uppercase tracking-wide cursor-pointer"
                      >
                        {approvingIndex === index ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Aprobar"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Change status dialog */}
      <Dialog
        open={changeStatusOpenIndex !== null}
        onOpenChange={(open) => !open && setChangeStatusOpenIndex(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado del préstamo</DialogTitle>
          </DialogHeader>
          <Form {...changeMilestoneStatusHook.form}>
            <form
              onSubmit={(e) => {
                changeMilestoneStatusHook.handleSubmit(e);
                setChangeStatusOpenIndex(null);
              }}
              className="flex flex-col space-y-4"
            >
              <FormField
                control={changeMilestoneStatusHook.form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Estado<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: completed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changeMilestoneStatusHook.form.control}
                name="evidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidencia</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Evidencia (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={changeMilestoneStatusHook.isSubmitting}
                className="cursor-pointer"
              >
                {changeMilestoneStatusHook.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Actualizar"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add new milestone */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Agregar Nuevo Beneficiario
        </p>

        <div className="rounded-xl border border-border bg-card p-6">
          <Form {...form}>
            <form onSubmit={handleAddLoan} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Préstamo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el propósito de este hito"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium leading-none">Dirección ONG</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 h-9">
                    <Wallet className="size-3.5 shrink-0 text-text-muted" />
                    {shortAddress ? (
                      <span className="font-mono text-xs text-foreground truncate">
                        {shortAddress}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted italic">Sin wallet conectada</span>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto (USDC)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pr-14"
                            {...field}
                            onKeyDown={numericInputKeyDown}
                            onChange={(e) => field.onChange(parseNumericInput(e.target.value))}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                            USDC
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={addingLoan}
                className="w-full cursor-pointer"
              >
                {addingLoan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Crear Nuevo Hito"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
