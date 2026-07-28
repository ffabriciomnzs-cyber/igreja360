import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PublicEventsController } from './public-events.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  // PublicEventsController serve só o banner e NÃO tem guarda — ver o
  // comentário no próprio arquivo.
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
