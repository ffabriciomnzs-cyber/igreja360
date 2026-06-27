import { Module } from '@nestjs/common';
import { WorshipService } from './worship.service';
import { WorshipAiService } from './worship-ai.service';
import { WorshipController } from './worship.controller';

@Module({
  controllers: [WorshipController],
  providers: [WorshipService, WorshipAiService],
  exports: [WorshipService],
})
export class WorshipModule {}
