import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * MÓDULO FUTURO — Rede Social / Comunidade (ver brief, seção 12).
 *
 * Este gateway está PREPARADO mas DESABILITADO. Não é importado no AppModule,
 * portanto não inicia em produção. Para ativar:
 *   1. Importar RealtimeModule no AppModule.
 *   2. Configurar Redis Pub/Sub para escala horizontal (presença/mensagens).
 *   3. Definir CORS adequado no decorator @WebSocketGateway.
 *
 * Funcionalidades planejadas: presença online ao vivo, comentários em tempo
 * real em cultos/células, reações/stickers e notificações push (Firebase FCM).
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? false } })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket): void {
    this.logger.debug(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }
}
