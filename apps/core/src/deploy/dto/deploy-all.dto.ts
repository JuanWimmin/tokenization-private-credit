import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class DeployAllDto {
  @IsString()
  @IsNotEmpty()
  tokenName: string;

  @IsString()
  @IsNotEmpty()
  tokenSymbol: string;

  @IsString()
  @IsNotEmpty()
  escrowId: string;

  @IsString()
  @IsNotEmpty()
  escrowContract: string;

  @IsNumber()
  @IsNotEmpty()
  roiPercentage: number;

  @IsNumber()
  @IsNotEmpty()
  hardCap: number;

  @IsNumber()
  @IsNotEmpty()
  maxPerInvestor: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
