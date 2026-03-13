import { Module } from '@nestjs/common';
import { ParticipationTokenController } from './participation-token.controller';
import { ParticipationTokenService } from './participation-token.service';

@Module({
  controllers: [ParticipationTokenController],
  providers: [ParticipationTokenService],
})
export class ParticipationTokenModule {}