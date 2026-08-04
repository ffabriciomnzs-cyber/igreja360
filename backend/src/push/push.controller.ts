import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

/**
 * Notificações no PAINEL (pastor, secretaria, admin) — o portal do membro tem
 * as suas próprias rotas em /member-auth/push/*. Aqui o aparelho de quem
 * administra a igreja se inscreve para receber avisos como "membro pediu
 * redefinição de senha".
 */
@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('key')
  key() {
    return { key: this.push.getPublicKey() };
  }

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(
    @CurrentUser() user: AuthUser,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    await this.push.saveUserSubscription(user.churchId, user.id, body);
    return { ok: true };
  }

  @Post('status')
  @HttpCode(200)
  async status(
    @CurrentUser() user: AuthUser,
    @Body() body: { endpoint?: string },
  ) {
    const subscribed = body?.endpoint
      ? await this.push.userHasSubscription(user.id, body.endpoint)
      : false;
    return { subscribed };
  }

  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.push.removeSubscription(body?.endpoint);
    return { ok: true };
  }
}
