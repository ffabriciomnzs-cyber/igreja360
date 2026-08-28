import { Global, Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';

// Global: o portal do membro usa o serviço para "Minha turma".
@Global()
@Module({
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
