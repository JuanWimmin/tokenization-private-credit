import { IsString, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class ApproveDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  spender: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsPositive()
  expirationLedger: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
