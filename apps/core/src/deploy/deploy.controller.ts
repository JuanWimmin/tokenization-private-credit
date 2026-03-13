import { Controller, Post, Body } from '@nestjs/common';
import { DeployService } from './deploy.service';
import { DeployAllDto } from './dto/deploy-all.dto';
import { DeployParticipationTokenDto } from './dto/deploy-participation-token.dto';
import { DeployTokenSaleDto } from './dto/deploy-token-sale.dto';
import { DeployVaultDto } from './dto/deploy-vault.dto';
import { SetAdminDto } from './dto/set-admin.dto';

@Controller('deploy')
export class DeployController {
  constructor(private readonly deployService: DeployService) {}

  @Post('participation-token')
  async deployParticipationToken(@Body() dto: DeployParticipationTokenDto) {
    const unsignedXdr = await this.deployService.deployParticipationToken(dto);
    return { unsignedXdr };
  }

  @Post('token-sale')
  async deployTokenSale(@Body() dto: DeployTokenSaleDto) {
    const unsignedXdr = await this.deployService.deployTokenSale(dto);
    return { unsignedXdr };
  }

  @Post('vault')
  async deployVault(@Body() dto: DeployVaultDto) {
    const unsignedXdr = await this.deployService.deployVault(dto);
    return { unsignedXdr };
  }

  @Post('all')
  async deployAll(@Body() dto: DeployAllDto) {
    const unsignedXdr = await this.deployService.deployAll(dto);
    return { unsignedXdr };
  }

  @Post('set-admin')
  async setAdmin(@Body() dto: SetAdminDto) {
    const unsignedXdr = await this.deployService.buildSetAdminTransaction(dto);
    return { unsignedXdr };
  }
}