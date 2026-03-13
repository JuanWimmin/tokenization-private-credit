import { IsString, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
