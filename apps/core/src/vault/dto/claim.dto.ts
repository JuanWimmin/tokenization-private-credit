import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  beneficiary: string;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}
