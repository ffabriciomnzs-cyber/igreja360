import { Module } from '@nestjs/common';
import { WorshipService } from './worship.service';
import { WorshipController } from './worship.controller';

@Module({
  controllers: [WorshipController],
  providers: [WorshipService],
  exports: [WorshipService],
})
export class WorshipModule {}
