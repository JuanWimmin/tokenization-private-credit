import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SorobanService } from '../soroban/soroban.service';
import { toMicroUSDC } from '../common/utils/micro-usdc';
import { DeployAllDto } from './dto/deploy-all.dto';
import { DeployParticipationTokenDto } from './dto/deploy-participation-token.dto';
import { DeployTokenSaleDto } from './dto/deploy-token-sale.dto';
import { DeployVaultDto } from './dto/deploy-vault.dto';
import { SetAdminDto } from './dto/set-admin.dto';

const TOKEN_DECIMAL = 7;
const USDC_CONTRACT_ID = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

@Injectable()
export class DeployService {
  private readonly participationTokenWasmHash: string;
  private readonly tokenSaleWasmHash: string;
  private readonly vaultWasmHash: string;
  private readonly deployerContractId: string;

  constructor(private readonly soroban: SorobanService) {
    this.participationTokenWasmHash = process.env.PARTICIPATION_TOKEN_WASM_HASH!;
    this.tokenSaleWasmHash = process.env.TOKEN_SALE_WASM_HASH!;
    this.vaultWasmHash = process.env.VAULT_WASM_HASH!;
    this.deployerContractId = process.env.DEPLOYER_CONTRACT_ID!;
  }

  deployParticipationToken(dto: DeployParticipationTokenDto): Promise<string> {
    return this.soroban.buildDeployTransaction(
      this.participationTokenWasmHash,
      {
        name: dto.name,
        symbol: dto.symbol,
        escrow_id: dto.escrowContractId,
        decimal: TOKEN_DECIMAL,
        mint_authority: dto.mintAuthority,
      },
      dto.callerPublicKey,
    );
  }

  deployTokenSale(dto: DeployTokenSaleDto): Promise<string> {
    return this.soroban.buildDeployTransaction(
      this.tokenSaleWasmHash,
      {
        escrow_contract: dto.escrowContractId,
        admin: dto.admin,
        hard_cap: toMicroUSDC(dto.hardCap),
        max_per_investor: toMicroUSDC(dto.maxPerInvestor),
      },
      dto.callerPublicKey,
    );
  }

  deployVault(dto: DeployVaultDto): Promise<string> {
    return this.soroban.buildDeployTransaction(
      this.vaultWasmHash,
      {
        admin: dto.admin,
        enabled: dto.enabled,
        roi_percentage: dto.roiPercentage,
        token: dto.token,
        usdc: dto.usdc,
      },
      dto.callerPublicKey,
    );
  }

  deployAll(dto: DeployAllDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      this.deployerContractId,
      'deploy_all',
      {
        signer: dto.callerPublicKey,
        params: {
          decimal: TOKEN_DECIMAL,
          escrow_contract: dto.escrowContract,
          escrow_id: dto.escrowId,
          hard_cap: toMicroUSDC(dto.hardCap),
          max_per_investor: toMicroUSDC(dto.maxPerInvestor),
          participation_salt: randomBytes(32),
          roi_percentage: dto.roiPercentage,
          token_name: dto.tokenName,
          token_sale_admin: dto.callerPublicKey,
          token_sale_salt: randomBytes(32),
          token_symbol: dto.tokenSymbol,
          usdc: USDC_CONTRACT_ID,
          vault_admin: dto.callerPublicKey,
          vault_enabled: false,
          vault_salt: randomBytes(32),
        },
      },
      dto.callerPublicKey,
    );
  }

  buildSetAdminTransaction(dto: SetAdminDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'set_admin',
      { new_admin: dto.newAdmin },
      dto.callerPublicKey,
    );
  }
}