import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsString()
  @IsNotEmpty()
  investorAddress: string;

  @IsNumber()
  @IsPositive()
  usdcAmount: number;

  @IsNumber()
  @IsPositive()
  tokenAmount: number;

  @IsString()
  @IsNotEmpty()
  txHash: string;
}
