import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { BuyDto } from './dto/buy.dto';
import { UpdateCapsDto } from './dto/update-caps.dto';
import { SetTokenDto } from './dto/set-token.dto';
import { SetAdminDto } from './dto/set-admin.dto';

@Injectable()
export class TokenSaleService {
  constructor(private readonly soroban: SorobanService) {}

  // ── Writes ──

  buy(dto: BuyDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'buy',
      {
        usdc: dto.usdcAddress,
        payer: dto.payer,
        beneficiary: dto.beneficiary,
        amount: dto.amount,
      },
      dto.callerPublicKey,
    );
  }

  updateCaps(dto: UpdateCapsDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'update_caps',
      {
        new_hard_cap: dto.newHardCap,
        new_max_per_investor: dto.newMaxPerInvestor,
      },
      dto.callerPublicKey,
    );
  }

  setToken(dto: SetTokenDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'set_token',
      { new_token: dto.newToken },
      dto.callerPublicKey,
    );
  }

  setAdmin(dto: SetAdminDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'set_admin',
      { new_admin: dto.newAdmin },
      dto.callerPublicKey,
    );
  }

  // ── Reads ──

  getAdmin(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_admin', {}, callerPublicKey);
  }
}