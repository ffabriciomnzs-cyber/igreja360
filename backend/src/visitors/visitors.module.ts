import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import {
  PublicVisitorsController,
  VisitorsController,
} from './visitors.controller';

@Module({
  controllers: [PublicVisitorsController, VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
