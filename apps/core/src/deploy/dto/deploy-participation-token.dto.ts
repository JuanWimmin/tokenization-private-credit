import { IsString, IsNotEmpty } from 'class-validator';

export class DeployParticipationTokenDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsString()
  @IsNotEmpty()
  escrowContractId: string;

  @IsString()
  @IsNotEmpty()
  mintAuthority: string;

  @IsString()
  @IsNotEmpty()
  callerPublicKey: string;
}