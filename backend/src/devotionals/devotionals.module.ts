import { Module } from '@nestjs/common';
import { DevotionalsService } from './devotionals.service';
import { DevotionalsController } from './devotionals.controller';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [DevotionalsController, PlansController],
  providers: [DevotionalsService, PlansService],
})
export class DevotionalsModule {}
