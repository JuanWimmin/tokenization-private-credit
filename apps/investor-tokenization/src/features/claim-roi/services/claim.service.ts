import { httpClient } from "@/lib/httpClient";

export type ClaimROIPayload = {
  vaultContractId: string;
  beneficiaryAddress: string;
};

export type ClaimROIResponse = {
  success: boolean;
  xdr: string;
  message: string;
};

export class ClaimROIService {
  async claimROI(payload: ClaimROIPayload): Promise<ClaimROIResponse> {
    const { data } = await httpClient.post<{ unsignedXdr: string }>(
      "/vault/claim",
      {
        contractId: payload.vaultContractId,
        beneficiary: payload.beneficiaryAddress,
        callerPublicKey: payload.beneficiaryAddress,
      },
    );

    return {
      success: true,
      xdr: data.unsignedXdr,
      message: "Transaction built successfully.",
    };
  }
}
