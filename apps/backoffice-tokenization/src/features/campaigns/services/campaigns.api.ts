import type { Campaign } from "@/features/campaigns/types/campaign.types";

const CORE_API =
  process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:4000";

const API_KEY = process.env.NEXT_PUBLIC_CORE_API_KEY ?? "";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CORE_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Error ${res.status} en ${path}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function getCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${CORE_API}/campaigns`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error("No se pudieron cargar las campañas.");
  return res.json();
}

export async function getCampaignById(id: string): Promise<Campaign> {
  const res = await fetch(`${CORE_API}/campaigns/${id}`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error("No se pudo cargar la campaña.");
  return res.json();
}

export async function deployAll(params: {
  tokenName: string;
  tokenSymbol: string;
  escrowId: string;
  escrowContract: string;
  roiPercentage: number;
  hardCap: number;
  maxPerInvestor: number;
  callerPublicKey: string;
}): Promise<{ unsignedXdr: string }> {
  return post("/deploy/all", params);
}

export async function updateCampaignStatus(
  id: string,
  status: string,
): Promise<unknown> {
  const res = await fetch(`${CORE_API}/campaigns/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Error ${res.status}`,
    );
  }
  return res.json();
}

export async function createCampaign(params: {
  name: string;
  description: string;
  issuerAddress: string;
  escrowId: string;
  poolSize: number;
  loanDuration: number;
  expectedReturn: number;
  loanSize: number;
  tokenFactoryId: string;
  tokenSaleId: string;
  vaultId?: string;
}): Promise<{ id: string }> {
  return post("/campaigns", params);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${CORE_API}${path}`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Error ${res.status} on ${path}`,
    );
  }
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CORE_API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Error ${res.status} on ${path}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function enableVault(params: {
  contractId: string;
  admin: string;
  enabled: boolean;
  callerPublicKey: string;
}): Promise<{ unsignedXdr: string }> {
  return post("/vault/availability-for-exchange", params);
}

export async function getVaultIsEnabled(
  contractId: string,
  callerPublicKey: string,
): Promise<{ enabled: boolean }> {
  return get(
    `/vault/is-enabled?contractId=${contractId}&callerPublicKey=${callerPublicKey}`,
  );
}

export async function updateCampaignVaultId(
  campaignId: string,
  vaultId: string,
): Promise<unknown> {
  return patch(`/campaigns/${campaignId}`, { vaultId });
}
