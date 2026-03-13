import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SorobanModule } from './soroban/soroban.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { InvestmentsModule } from './investments/investments.module';
import { DeployModule } from './deploy/deploy.module';
import { LoansModule } from './loans/loans.module';
import { ParticipationTokenModule } from './participation-token/participation-token.module';
import { VaultModule } from './vault/vault.module';
import { TokenSaleModule } from './token-sale/token-sale.module';

@Module({
  imports: [
    PrismaModule,
    SorobanModule,
    CampaignsModule,
    InvestmentsModule,
    DeployModule,
    LoansModule,
    ParticipationTokenModule,
    VaultModule,
    TokenSaleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}