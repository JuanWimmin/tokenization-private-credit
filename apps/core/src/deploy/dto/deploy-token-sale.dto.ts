import { IsString, IsInt, IsNotEmpty, IsPositive, IsBoolean } from 'class-validator';

export class DeployTokenSaleDto {
  @IsString()
  @IsNotEmpty()
  escrowContractId: string;

  @IsString()
  @IsNotEmpty()
  admin: string;

  @IsInt()
  @IsPositive()
  hardCap: number;

  @IsInt()
  @IsPositive()
  maxPerInvestor: number;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}