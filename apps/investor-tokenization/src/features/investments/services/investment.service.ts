import axios, { AxiosInstance } from "axios";
import { httpClient } from "@/lib/httpClient";

export type TokenBalancePayload = {
  tokenFactoryAddress: string;
  address: string;
};

export type TokenBalanceResponse = {
  success: boolean;
  balance: string;
  error?: string;
};

export type TokenMetadataPayload = {
  tokenFactoryAddress: string;
};

export type TokenMetadataResponse = {
  success: boolean;
  name: string;
  symbol: string;
  decimals: number;
  error?: string;
};

export type CreateInvestmentPayload = {
  campaignId: string;
  investorAddress: string;
  usdcAmount: number;
  tokenAmount: number;
  txHash: string;
};

export type InvestmentFromApi = {
  id: string;
  campaignId: string;
  investorAddress: string;
  usdcAmount: number;
  tokenAmount: number;
  txHash: string;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    escrowId: string;
    tokenFactoryId: string | null;
    tokenSaleId: string | null;
    vaultId: string | null;
    expectedReturn: number;
    loanDuration: number;
  };
};

export async function createInvestment(payload: CreateInvestmentPayload) {
  const { data } = await httpClient.post("/investments", payload);
  return data;
}

export async function fetchMyInvestments(
  investorAddress: string,
): Promise<InvestmentFromApi[]> {
  const { data } = await httpClient.get<InvestmentFromApi[]>(
    `/investments/investor/${investorAddress}`,
  );
  return data;
}

export class InvestmentService {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: "/api",
    });
  }

  async getTokenBalance(
    payload: TokenBalancePayload,
  ): Promise<TokenBalanceResponse> {
    const response = await this.axios.post<TokenBalanceResponse>(
      "/token-balance",
      payload,
    );

    return response.data;
  }

  async getTokenMetadata(
    payload: TokenMetadataPayload,
  ): Promise<TokenMetadataResponse> {
    const response = await this.axios.post<TokenMetadataResponse>(
      "/token-metadata",
      payload,
    );

    return response.data;
  }
}


