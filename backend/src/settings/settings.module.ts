import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { LiveService } from './live.service';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, LiveService],
  exports: [SettingsService, LiveService],
})
export class SettingsModule {}
