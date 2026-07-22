import { Module } from '@nestjs/common';
import { WorshipService } from './worship.service';
import { WorshipAiService } from './worship-ai.service';
import { WorshipController } from './worship.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [WorshipController],
  providers: [WorshipService, WorshipAiService],
  exports: [WorshipService],
})
export class WorshipModule {}
