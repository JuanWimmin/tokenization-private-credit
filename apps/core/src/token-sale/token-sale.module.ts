import { Module } from '@nestjs/common';
import { TokenSaleController } from './token-sale.controller';
import { TokenSaleService } from './token-sale.service';

@Module({
  controllers: [TokenSaleController],
  providers: [TokenSaleService],
})
export class TokenSaleModule {}
