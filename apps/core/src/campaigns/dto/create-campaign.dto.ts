import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  issuerAddress: string;

  @IsString()
  @IsNotEmpty()
  escrowId: string;

  @IsNumber()
  @IsPositive()
  poolSize: number;

  @IsNumber()
  @Min(1)
  loanDuration: number;

  @IsNumber()
  @IsPositive()
  expectedReturn: number;

  @IsNumber()
  @IsPositive()
  loanSize: number;

  @IsString()
  @IsNotEmpty()
  tokenFactoryId: string;

  @IsString()
  @IsNotEmpty()
  tokenSaleId: string;

  @IsString()
  @IsOptional()
  vaultId?: string;
}
