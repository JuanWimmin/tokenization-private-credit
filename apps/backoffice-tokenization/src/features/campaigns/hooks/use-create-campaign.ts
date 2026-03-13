"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { useEscrowsMutations } from "@tokenization/tw-blocks-shared/src/tanstack/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@tokenization/tw-blocks-shared/src/handle-errors/handle";
import { signTransaction } from "@tokenization/tw-blocks-shared/src/wallet-kit/wallet-kit";
import type { InitializeMultiReleaseEscrowPayload } from "@trustless-work/escrow/types";
import type {
  CreateCampaignFormValues,
  PhaseStatus,
  PhaseState,
} from "@/features/campaigns/types/campaign.types";
import { deployAll, createCampaign } from "@/features/campaigns/services/campaigns.api";
import { submitAndExtractDeployedContracts } from "@/features/campaigns/services/soroban.service";

// --- Constants ---

const USDC_TESTNET_ADDRESS =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const STORAGE_KEY = "campaigns-create-flow";

const DEPLOY_PHASE_LABELS = [
  "Creando token de participación y tokenizando",
  "Últimos pasos...",
];

// --- Utility functions ---

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function slugToSymbol(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase() || "TKN"
  );
}

// --- Zod schema ---

const campaignSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  poolSize: z.coerce.number().positive("Debe ser mayor a 0"),
  loanDuration: z.coerce.number().int().positive("Debe ser mayor a 0"),
  expectedReturn: z.coerce.number().positive("Debe ser mayor a 0"),
  loanSize: z.coerce.number().positive("Debe ser mayor a 0"),
  tokenName: z.string().min(1, "El nombre del token es requerido"),
});

// --- LocalStorage persistence ---

interface FlowState {
  campaign: CreateCampaignFormValues | null;
  escrowContractId: string | null;
  escrowEngagementId: string | null;
  participationToken: string | null;
  tokenSale: string | null;
  vaultContract: string | null;
  campaignDbId: string | null;
}

function emptyFlowState(): FlowState {
  return {
    campaign: null,
    escrowContractId: null,
    escrowEngagementId: null,
    participationToken: null,
    tokenSale: null,
    vaultContract: null,
    campaignDbId: null,
  };
}

function loadFlowState(): FlowState {
  if (typeof window === "undefined") return emptyFlowState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyFlowState();
  return JSON.parse(raw) as FlowState;
}

function saveFlowState(partial: Partial<FlowState>) {
  const current = loadFlowState();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...current, ...partial }),
  );
}

function clearFlowState() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Hook ---

const TOTAL_STEPS = 3;

export function useCreateCampaign() {
  const router = useRouter();
  const { walletAddress } = useWalletContext();
  const { deployEscrow } = useEscrowsMutations();
  const [step, setStep] = useState(1);

  // --- Escrow state (Step 2) ---
  const [escrowStatus, setEscrowStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [escrowContractId, setEscrowContractId] = useState<string | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);

  // --- Deploy state (Step 3) ---
  const [deployPhases, setDeployPhases] = useState<PhaseState[]>(
    DEPLOY_PHASE_LABELS.map(() => ({ status: "idle" as PhaseStatus, error: "" })),
  );
  const [deployFailedAt, setDeployFailedAt] = useState<number | null>(null);

  // --- Form ---
  const form = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      poolSize: "" as unknown as number,
      loanDuration: "" as unknown as number,
      expectedReturn: "" as unknown as number,
      loanSize: "" as unknown as number,
      tokenName: "",
    },
    mode: "onChange",
  });

  // --- Step navigation ---
  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger();
      if (!valid) return;
      const values = form.getValues();
      saveFlowState({ campaign: values });
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // --- Step 2: Deploy escrow ---
  const initializeEscrow = useCallback(async () => {
    const state = loadFlowState();
    const campaign = state.campaign;
    if (!campaign || !walletAddress) return;

    setEscrowStatus("loading");
    setEscrowError(null);

    try {
      const currentYear = new Date().getFullYear();
      const engagementId = `interactuar-${currentYear}-${slugify(campaign.name)}`;

      const payload: InitializeMultiReleaseEscrowPayload = {
        title: campaign.name,
        engagementId,
        description: campaign.description,
        platformFee: 0,
        trustline: {
          address: USDC_TESTNET_ADDRESS,
          symbol: "USDC",
        },
        roles: {
          approver: walletAddress,
          serviceProvider: walletAddress,
          platformAddress: walletAddress,
          releaseSigner: walletAddress,
          disputeResolver: walletAddress,
        },
        milestones: [
          {
            receiver: walletAddress,
            description: "Ganancia",
            amount: 1,
          },
        ],
        signer: walletAddress,
      };

      const response = await deployEscrow.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress,
      });

      const id = (response as { contractId?: string })?.contractId;
      if (id) {
        saveFlowState({ escrowContractId: id, escrowEngagementId: engagementId });
        setEscrowContractId(id);
      }
      setEscrowStatus("success");
    } catch (error) {
      const { message } = handleError(error as ErrorResponse);
      setEscrowError(message);
      setEscrowStatus("error");
    }
  }, [walletAddress, deployEscrow]);

  const retryEscrow = useCallback(() => {
    initializeEscrow();
  }, [initializeEscrow]);

  // --- Step 3: Deploy-all + create campaign ---
  const setPhaseStatus = (index: number, status: PhaseStatus, error = "") => {
    setDeployPhases((prev) =>
      prev.map((p, i) => (i === index ? { status, error } : p)),
    );
  };

  const runDeployAndCreate = useCallback(async (startFrom = 0) => {
    const state = loadFlowState();
    const { campaign, escrowContractId: escrowContract, escrowEngagementId } = state;
    if (!campaign || !escrowContract || !escrowEngagementId || !walletAddress) return;

    setDeployFailedAt(null);
    let currentPhase = startFrom;

    try {
      // Phase 0: deploy-all
      if (startFrom <= 0) {
        currentPhase = 0;
        setPhaseStatus(0, "loading");

        const { unsignedXdr } = await deployAll({
          tokenName: campaign.tokenName,
          tokenSymbol: slugToSymbol(campaign.tokenName),
          escrowId: escrowEngagementId,
          escrowContract,
          roiPercentage: Number(campaign.expectedReturn),
          hardCap: Number(campaign.poolSize),
          maxPerInvestor: Number(campaign.loanSize),
          callerPublicKey: walletAddress,
        });

        const signedXdr = await signTransaction({
          unsignedTransaction: unsignedXdr,
          address: walletAddress,
        });

        const contracts = await submitAndExtractDeployedContracts(signedXdr);
        saveFlowState({
          participationToken: contracts.participation_token,
          tokenSale: contracts.token_sale,
          vaultContract: contracts.vault_contract,
        });
        setPhaseStatus(0, "success");
      }

      // Phase 1: create campaign in DB
      if (startFrom <= 1) {
        currentPhase = 1;
        setPhaseStatus(1, "loading");

        const updatedState = loadFlowState();
        const created = await createCampaign({
          name: campaign.name,
          description: campaign.description,
          issuerAddress: walletAddress,
          escrowId: escrowContract,
          poolSize: Number(campaign.poolSize),
          loanDuration: Number(campaign.loanDuration),
          expectedReturn: Number(campaign.expectedReturn),
          loanSize: Number(campaign.loanSize),
          tokenFactoryId: updatedState.participationToken!,
          tokenSaleId: updatedState.tokenSale!,
          vaultId: updatedState.vaultContract!,
        });

        saveFlowState({ campaignDbId: created.id });
        setPhaseStatus(1, "success");

        setTimeout(() => {
          clearFlowState();
          router.push("/campaigns");
        }, 1500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setPhaseStatus(currentPhase, "error", message);
      setDeployFailedAt(currentPhase);
    }
  }, [walletAddress, router]);

  const retryDeploy = useCallback(() => {
    if (deployFailedAt === null) return;
    setDeployPhases((prev) =>
      prev.map((p, i) =>
        i >= deployFailedAt
          ? { status: "idle" as PhaseStatus, error: "" }
          : p,
      ),
    );
    runDeployAndCreate(deployFailedAt);
  }, [deployFailedAt, runDeployAndCreate]);

  return {
    form,
    step,
    totalSteps: TOTAL_STEPS,
    nextStep,
    prevStep,
    walletAddress,
    // Escrow (Step 2)
    escrowStatus,
    escrowContractId,
    escrowError,
    initializeEscrow,
    retryEscrow,
    // Deploy (Step 3)
    deployPhases,
    deployPhaseLabels: DEPLOY_PHASE_LABELS,
    deployFailedAt,
    runDeployAndCreate,
    retryDeploy,
  };
}
