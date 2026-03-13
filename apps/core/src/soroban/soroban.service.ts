import { Injectable } from '@nestjs/common';
import { contract, Networks } from '@stellar/stellar-sdk';
import { Ok } from '@stellar/stellar-sdk/contract';

@Injectable()
export class SorobanService {
  private readonly rpcUrl: string;
  private readonly networkPassphrase: string;

  constructor() {
    this.rpcUrl = process.env.SOROBAN_RPC_URL!;
    this.networkPassphrase = Networks.TESTNET;
  }

  async buildDeployTransaction(
    wasmHash: string,
    args: Record<string, unknown>,
    callerPublicKey: string,
  ): Promise<string> {
    const tx = await contract.Client.deploy(args, {
      wasmHash,
      format: 'hex',
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey: callerPublicKey,
    });

    return tx.toXDR();
  }

  async buildContractCallTransaction(
    contractId: string,
    method: string,
    args: Record<string, unknown>,
    callerPublicKey: string,
  ): Promise<string> {
    const client = await contract.Client.from({
      contractId,
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey: callerPublicKey,
    });

    const tx = await client[method](args);

    return tx.toXDR();
  }

  async readContractState(
    contractId: string,
    method: string,
    args: Record<string, unknown>,
    callerPublicKey: string,
  ): Promise<unknown> {
    const client = await contract.Client.from({
      contractId,
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey: callerPublicKey,
    });

    const result = await client[method](args);
    const raw = result.result;

    return raw instanceof Ok ? raw.unwrap() : raw;
  }
}
