import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service';
import { NotificationsScheduler } from './notifications.scheduler';

@Global()
@Module({
  providers: [PushService, NotificationsScheduler],
  exports: [PushService],
})
export class PushModule {}
