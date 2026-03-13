import { httpClient } from "@/lib/httpClient";

export type BuyTokenPayload = {
  tokenSaleContractId: string;
  usdcAddress: string;
  payerAddress: string;
  beneficiaryAddress: string;
  amount: number;
};

export type DeployTokenResponse = {
  success: boolean;
  xdr: string;
  message: string;
};

export class TokenService {
  async buyToken(payload: BuyTokenPayload): Promise<DeployTokenResponse> {
    const { data } = await httpClient.post<{ unsignedXdr: string }>(
      "/token-sale/buy",
      {
        contractId: payload.tokenSaleContractId,
        usdcAddress: payload.usdcAddress,
        payer: payload.payerAddress,
        beneficiary: payload.beneficiaryAddress,
        amount: payload.amount,
        callerPublicKey: payload.payerAddress,
      },
    );

    return {
      success: true,
      xdr: data.unsignedXdr,
      message: "Transaction built successfully.",
    };
  }
}
