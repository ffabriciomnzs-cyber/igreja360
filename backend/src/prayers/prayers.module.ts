import { Module } from '@nestjs/common';
import { PrayersService } from './prayers.service';
import { PrayersController } from './prayers.controller';

@Module({
  controllers: [PrayersController],
  providers: [PrayersService],
  exports: [PrayersService],
})
export class PrayersModule {}
