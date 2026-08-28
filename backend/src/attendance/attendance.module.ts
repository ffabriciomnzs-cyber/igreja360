import { Global, Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

// Global: o portal do membro (MemberAuthModule) também usa o serviço para o
// botão "Estou aqui".
@Global()
@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
