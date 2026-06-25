import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * DESABILITADO por padrão. Importar no AppModule para ativar (ver seção 12 do brief).
 */
@Module({
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
