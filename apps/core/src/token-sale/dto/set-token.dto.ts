import { IsString, IsNotEmpty } from 'class-validator';

export class SetTokenDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  newToken: string;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}