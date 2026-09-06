import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { AnnounceService } from './announce.service';

@Global()
@Module({
  controllers: [PushController],
  providers: [PushService, NotificationsScheduler, AnnounceService],
  exports: [PushService],
})
export class PushModule {}
