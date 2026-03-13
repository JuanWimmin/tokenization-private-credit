import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { VaultService } from './vault.service';
import { AvailabilityForExchangeDto } from './dto/availability-for-exchange.dto';
import { ClaimDto } from './dto/claim.dto';

@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Post('availability-for-exchange')
  async availabilityForExchange(@Body() dto: AvailabilityForExchangeDto) {
    const unsignedXdr = await this.vaultService.availabilityForExchange(dto);
    return { unsignedXdr };
  }

  @Post('claim')
  async claim(@Body() dto: ClaimDto) {
    const unsignedXdr = await this.vaultService.claim(dto);
    return { unsignedXdr };
  }

  @Get('overview')
  async getOverview(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    return this.vaultService.getOverview(contractId, callerPublicKey);
  }

  @Get('preview-claim')
  async previewClaim(
    @Query('contractId') contractId: string,
    @Query('beneficiary') beneficiary: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    return this.vaultService.previewClaim(contractId, beneficiary, callerPublicKey);
  }

  @Get('is-enabled')
  async isEnabled(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const enabled = await this.vaultService.isEnabled(contractId, callerPublicKey);
    return { enabled };
  }

  @Get('usdc-balance')
  async getUsdcBalance(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const balance = await this.vaultService.getUsdcBalance(contractId, callerPublicKey);
    return { balance: String(balance) };
  }

  @Get('total-redeemed')
  async getTotalRedeemed(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const totalTokensRedeemed = await this.vaultService.getTotalTokensRedeemed(contractId, callerPublicKey);
    return { totalTokensRedeemed: String(totalTokensRedeemed) };
  }

  @Get('admin')
  async getAdmin(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const admin = await this.vaultService.getAdmin(contractId, callerPublicKey);
    return { admin: String(admin) };
  }

  @Get('roi-percentage')
  async getRoiPercentage(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const roiPercentage = await this.vaultService.getRoiPercentage(contractId, callerPublicKey);
    return { roiPercentage: String(roiPercentage) };
  }

  @Get('token-address')
  async getTokenAddress(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const tokenAddress = await this.vaultService.getTokenAddress(contractId, callerPublicKey);
    return { tokenAddress: String(tokenAddress) };
  }

  @Get('usdc-address')
  async getUsdcAddress(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const usdcAddress = await this.vaultService.getUsdcAddress(contractId, callerPublicKey);
    return { usdcAddress: String(usdcAddress) };
  }
}
