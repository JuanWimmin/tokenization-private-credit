import { Injectable } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../soroban/soroban.service';
import { AvailabilityForExchangeDto } from './dto/availability-for-exchange.dto';
import { ClaimDto } from './dto/claim.dto';

@Injectable()
export class VaultService {
  constructor(
    private readonly soroban: SorobanService,
    private readonly prisma: PrismaService,
  ) {}

  async availabilityForExchange(dto: AvailabilityForExchangeDto): Promise<string> {
    const unsignedXdr = await this.soroban.buildContractCallTransaction(
      dto.contractId,
      'availability_for_exchange',
      { enabled: dto.enabled },
      dto.callerPublicKey,
    );

    if (dto.enabled && dto.campaignId) {
      await this.prisma.campaign.update({
        where: { id: dto.campaignId },
        data: { status: CampaignStatus.CLAIMABLE },
      });
    }

    return unsignedXdr;
  }

  claim(dto: ClaimDto): Promise<string> {
    return this.soroban.buildContractCallTransaction(
      dto.contractId,
      'claim',
      {
        beneficiary: dto.beneficiary,
      },
      dto.callerPublicKey,
    );
  }

  getOverview(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(
      contractId,
      'get_vault_overview',
      {},
      callerPublicKey,
    );
  }

  previewClaim(
    contractId: string,
    beneficiary: string,
    callerPublicKey: string,
  ): Promise<unknown> {
    return this.soroban.readContractState(
      contractId,
      'preview_claim',
      { beneficiary },
      callerPublicKey,
    );
  }

  isEnabled(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'is_enabled', {}, callerPublicKey);
  }

  getUsdcBalance(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_vault_usdc_balance', {}, callerPublicKey);
  }

  getTotalTokensRedeemed(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_total_tokens_redeemed', {}, callerPublicKey);
  }

  getAdmin(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_admin', {}, callerPublicKey);
  }

  getRoiPercentage(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_roi_percentage', {}, callerPublicKey);
  }

  getTokenAddress(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_token_address', {}, callerPublicKey);
  }

  getUsdcAddress(contractId: string, callerPublicKey: string): Promise<unknown> {
    return this.soroban.readContractState(contractId, 'get_usdc_address', {}, callerPublicKey);
  }
}
