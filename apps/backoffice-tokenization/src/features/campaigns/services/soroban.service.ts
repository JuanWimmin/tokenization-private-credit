import {
  rpc,
  TransactionBuilder,
  Networks,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";

export interface DeployedContracts {
  participation_token: string;
  token_sale: string;
  vault_contract: string;
}

export async function submitAndExtractDeployedContracts(
  signedXdr: string,
): Promise<DeployedContracts> {
  const server = new rpc.Server(
    "https://soroban-testnet.stellar.org",
  );
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const send = await server.sendTransaction(tx);
  if (send.status === "ERROR") {
    throw new Error(
      `Soroban error: ${JSON.stringify(send.errorResult)}`,
    );
  }

  let result: rpc.Api.GetTransactionResponse | undefined;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    result = await server.getTransaction(send.hash);
    if (result.status !== rpc.Api.GetTransactionStatus.NOT_FOUND)
      break;
  }

  if (
    !result ||
    result.status !== rpc.Api.GetTransactionStatus.SUCCESS
  ) {
    throw new Error(
      `Transaction ${result?.status ?? "TIMEOUT"}`,
    );
  }

  const success =
    result as rpc.Api.GetSuccessfulTransactionResponse;

  if (!success.returnValue) {
    throw new Error("La transacción no retornó un valor");
  }

  const native = scValToNative(success.returnValue) as DeployedContracts;
  return native;
}

export async function submitAndExtractAddress(
  signedXdr: string,
): Promise<string | null> {
  const server = new rpc.Server(
    "https://soroban-testnet.stellar.org",
  );
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const send = await server.sendTransaction(tx);
  if (send.status === "ERROR") {
    throw new Error(
      `Soroban error: ${JSON.stringify(send.errorResult)}`,
    );
  }

  let result: rpc.Api.GetTransactionResponse | undefined;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    result = await server.getTransaction(send.hash);
    if (result.status !== rpc.Api.GetTransactionStatus.NOT_FOUND)
      break;
  }

  if (
    !result ||
    result.status !== rpc.Api.GetTransactionStatus.SUCCESS
  ) {
    throw new Error(
      `Transaction ${result?.status ?? "TIMEOUT"}`,
    );
  }

  const success =
    result as rpc.Api.GetSuccessfulTransactionResponse;
  try {
    return success.returnValue
      ? Address.fromScVal(success.returnValue).toString()
      : null;
  } catch {
    return null;
  }
}
