import { IsString, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class DeployVaultDto {
  @IsString()
  @IsNotEmpty()
  admin: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  @IsInt()
  @IsNotEmpty()
  roiPercentage: number;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  usdc: string;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
