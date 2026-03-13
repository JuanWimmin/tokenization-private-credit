import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class BuyDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  usdcAddress: string;

  @IsString()
  @IsNotEmpty()
  payer: string;

  @IsString()
  @IsNotEmpty()
  beneficiary: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
