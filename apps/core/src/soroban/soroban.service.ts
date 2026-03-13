import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { contract, Networks, rpc } from '@stellar/stellar-sdk';
import { Ok } from '@stellar/stellar-sdk/contract';
import { TOKEN_SALE_ERRORS, VAULT_ERRORS } from './contract-errors.map';

@Injectable()
export class SorobanService {
  private readonly rpcUrl: string;
  private readonly networkPassphrase: string;
  private readonly contractErrorMaps: Map<string, Record<number, { name: string; message: string }>>;
  private readonly logger = new Logger(SorobanService.name);

  constructor() {
    this.rpcUrl = process.env.SOROBAN_RPC_URL!;
    this.networkPassphrase = Networks.TESTNET;
    this.contractErrorMaps = new Map([
      [process.env.TOKEN_SALE_CONTRACT_ID!, TOKEN_SALE_ERRORS],
      [process.env.VAULT_CONTRACT_ID!, VAULT_ERRORS],
    ]);
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
    errorContext?: string,
  ): Promise<string> {
    const client = await contract.Client.from({
      contractId,
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey: callerPublicKey,
    });

    const tx = await client[method](args);

    this.assertSimulationSuccess(tx.simulation, contractId);

    return tx.toXDR();
  }

  async readContractState(
    contractId: string,
    method: string,
    args: Record<string, unknown>,
    callerPublicKey: string,
    errorContext?: string,
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

  private assertSimulationSuccess(
    simulation: rpc.Api.SimulateTransactionResponse,
    contractId: string,
  ): void {
    if (!rpc.Api.isSimulationError(simulation)) return;

    const match =
      simulation.error.match(/Error\(Contract,\s*#(\d+)\)/) ??
      simulation.error.match(/ScError::Contract\(#(\d+)\)/);
    const code = match ? parseInt(match[1]) : null;

    const errorMap = this.contractErrorMaps.get(contractId);
    const contractError =
      code !== null
        ? (errorMap?.[code] ??
          [...this.contractErrorMaps.values()].map((m) => m[code!]).find(Boolean) ??
          null)
        : null;

    const message = contractError
      ? contractError.message
      : `Contract simulation failed: ${simulation.error}`;

    this.logger.warn(`Contract error #${code ?? 'unknown'} [${contractId}]: ${message}`);

    throw new BadRequestException(message);
  }
}
