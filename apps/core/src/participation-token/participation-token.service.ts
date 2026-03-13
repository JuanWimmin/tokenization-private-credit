import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { MintDto } from './dto/mint.dto';
import { SetAdminDto } from './dto/set-admin.dto';
import { ApproveDto } from './dto/approve.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransferFromDto } from './dto/transfer-from.dto';
import { BurnDto } from './dto/burn.dto';
import { BurnFromDto } from './dto/burn-from.dto';

@Injectable()
export class ParticipationTokenService {
  constructor(private readonly soroban: SorobanService) {}

  // ── Writes ──

  mint(dto: MintDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'mint',
      { to: dto.to, amount: dto.amount },
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

  approve(dto: ApproveDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'approve',
      {
        from: dto.from,
        spender: dto.spender,
        amount: dto.amount,
        expiration_ledger: dto.expirationLedger,
      },
      dto.callerPublicKey,
    );
  }

  transfer(dto: TransferDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'transfer',
      { from: dto.from, to_muxed: dto.to, amount: dto.amount },
      dto.callerPublicKey,
    );
  }

  transferFrom(dto: TransferFromDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'transfer_from',
      {
        spender: dto.spender,
        from: dto.from,
        to: dto.to,
        amount: dto.amount,
      },
      dto.callerPublicKey,
    );
  }

  burn(dto: BurnDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'burn',
      { from: dto.from, amount: dto.amount },
      dto.callerPublicKey,
    );
  }

  burnFrom(dto: BurnFromDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'burn_from',
      {
        spender: dto.spender,
        from: dto.from,
        amount: dto.amount,
      },
      dto.callerPublicKey,
    );
  }

  // ── Reads ──

  getBalance(contractId: string, address: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'balance', { id: address }, callerPublicKey);
  }

  getAllowance(
    contractId: string,
    from: string,
    spender: string,
    callerPublicKey: string,
  ): Promise<unknown> {
    return this.soroban.readContractState(
      contractId,
      'allowance',
      { from, spender },
      callerPublicKey,
    );
  }

  getDecimals(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'decimals', {}, callerPublicKey);
  }

  getName(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'name', {}, callerPublicKey);
  }

  getSymbol(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'symbol', {}, callerPublicKey);
  }

  getEscrowId(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'escrow_id', {}, callerPublicKey);
  }
}