import { IsString, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class AvailabilityForExchangeDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;

  @IsString()
  @IsOptional()
  campaignId?: string;
}
