import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { NotificationsScheduler } from './notifications.scheduler';

@Global()
@Module({
  controllers: [PushController],
  providers: [PushService, NotificationsScheduler],
  exports: [PushService],
})
export class PushModule {}
