import { Global, Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController, ScheduleController } from './teams.controller';

// Global: o portal do membro usa o serviço para "Minha escala".
@Global()
@Module({
  controllers: [TeamsController, ScheduleController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
