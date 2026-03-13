import { IsString, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class UpdateCapsDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsInt()
  @IsPositive()
  newHardCap: number;

  @IsInt()
  @IsPositive()
  newMaxPerInvestor: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}