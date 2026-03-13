import { IsString, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class BurnFromDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  spender: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
