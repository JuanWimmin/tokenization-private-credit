import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { TokenSaleService } from './token-sale.service';
import { BuyDto } from './dto/buy.dto';
import { UpdateCapsDto } from './dto/update-caps.dto';
import { SetTokenDto } from './dto/set-token.dto';
import { SetAdminDto } from './dto/set-admin.dto';

@Controller('token-sale')
export class TokenSaleController {
  constructor(private readonly tokenSaleService: TokenSaleService) { }

  // ── POST endpoints (writes) ──

  @Post('buy')
  async buy(@Body() dto: BuyDto) {
    const unsignedXdr = await this.tokenSaleService.buy(dto);
    return { unsignedXdr };
  }

  @Post('update-caps')
  async updateCaps(@Body() dto: UpdateCapsDto) {
    const unsignedXdr = await this.tokenSaleService.updateCaps(dto);
    return { unsignedXdr };
  }

  @Post('set-token')
  async setToken(@Body() dto: SetTokenDto) {
    const unsignedXdr = await this.tokenSaleService.setToken(dto);
    return { unsignedXdr };
  }

  @Post('set-admin')
  async setAdmin(@Body() dto: SetAdminDto) {
    const unsignedXdr = await this.tokenSaleService.setAdmin(dto);
    return { unsignedXdr };
  }

  // ── GET endpoints (reads) ──

  @Get('admin')
  async getAdmin(
    @Query('contractId') contractId: string,
    @Query('callerPublicKey') callerPublicKey: string,
  ) {
    const admin = await this.tokenSaleService.getAdmin(contractId, callerPublicKey);
    return { admin: String(admin) };
  }
}