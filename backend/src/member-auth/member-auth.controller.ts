import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_LOGIN } from '../throttle.config';
import { MemberAuthService } from './member-auth.service';
import { PortalService } from './portal.service';
import { MemberRegisterDto } from './dto/member-register.dto';
import { MemberLoginDto } from './dto/member-login.dto';
import { DevotionalNoteDto } from './dto/devotional-note.dto';
import { DevotionalReactDto } from './dto/devotional-react.dto';
import { CreatePrayerDto } from './dto/create-prayer.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { NotifyPrefsDto } from './dto/notify-prefs.dto';
import { MemberJwtGuard, MemberPrincipal } from './member-jwt.guard';
import { CurrentMember } from './current-member.decorator';
import { PushService } from '../push/push.service';

@Controller('member-auth')
export class MemberAuthController {
  constructor(
    private readonly memberAuth: MemberAuthService,
    private readonly portal: PortalService,
    private readonly push: PushService,
  ) {}

  // Chave pública VAPID p/ o membro se inscrever nas notificações (null se off).
  @Get('push/key')
  pushKey() {
    return { key: this.push.getPublicKey() };
  }

  @Post('push/subscribe')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  async pushSubscribe(
    @CurrentMember() member: MemberPrincipal,
    @Body()
    body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    await this.push.saveSubscription(member.churchId, member.id, body);
    return { ok: true };
  }

  // Preferências por categoria (Perfil → Notificações). Sempre pelo id do
  // JWT do membro: nunca aceita id vindo do cliente.
  @Get('push/prefs')
  @UseGuards(MemberJwtGuard)
  async pushPrefs(@CurrentMember() member: MemberPrincipal) {
    return this.push.getPrefs(member.id);
  }

  @Patch('push/prefs')
  @UseGuards(MemberJwtGuard)
  async pushPrefsUpdate(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: NotifyPrefsDto,
  ) {
    return this.push.setPrefs(member.id, dto);
  }

  @Post('push/unsubscribe')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  async pushUnsubscribe(@Body() body: { endpoint: string }) {
    await this.push.removeSubscription(body?.endpoint);
    return { ok: true };
  }

  @Get('church/:slug')
  churchInfo(@Param('slug') slug: string) {
    return this.memberAuth.churchInfo(slug);
  }

  @Throttle(THROTTLE_LOGIN)
  @Post('register')
  register(@Body() dto: MemberRegisterDto) {
    return this.memberAuth.register(dto);
  }

  @Throttle(THROTTLE_LOGIN)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: MemberLoginDto) {
    return this.memberAuth.login(dto);
  }

  @Get('home')
  @UseGuards(MemberJwtGuard)
  home(@CurrentMember() member: MemberPrincipal) {
    return this.portal.home(member.churchId);
  }

  @Get('me')
  @UseGuards(MemberJwtGuard)
  me(@CurrentMember() member: MemberPrincipal) {
    return this.portal.me(member.id);
  }

  @Get('devotional')
  @UseGuards(MemberJwtGuard)
  devotional(@CurrentMember() member: MemberPrincipal) {
    return this.portal.devotional(member.churchId, member.id);
  }

  @Post('devotional/pray')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  pray(@CurrentMember() member: MemberPrincipal) {
    return this.portal.togglePray(member.churchId, member.id);
  }

  @Post('devotional/complete')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  complete(@CurrentMember() member: MemberPrincipal) {
    return this.portal.complete(member.churchId, member.id);
  }

  @Post('devotional/note')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  note(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: DevotionalNoteDto,
  ) {
    return this.portal.saveNote(member.churchId, member.id, dto.text ?? '');
  }

  @Post('devotional/react')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  react(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: DevotionalReactDto,
  ) {
    return this.portal.react(member.churchId, member.id, dto.type);
  }

  @Patch('profile')
  @UseGuards(MemberJwtGuard)
  updateProfile(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: UpdateMemberProfileDto,
  ) {
    return this.portal.updateProfile(member.id, dto);
  }

  @Get('prayers')
  @UseGuards(MemberJwtGuard)
  myPrayers(@CurrentMember() member: MemberPrincipal) {
    return this.portal.myPrayers(member.id);
  }

  @Post('prayers')
  @UseGuards(MemberJwtGuard)
  createPrayer(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: CreatePrayerDto,
  ) {
    return this.portal.createPrayer(member.churchId, member.id, dto);
  }

  @Get('plans')
  @UseGuards(MemberJwtGuard)
  plans(@CurrentMember() member: MemberPrincipal) {
    return this.portal.plans(member.churchId, member.id);
  }

  @Get('plans/:id')
  @UseGuards(MemberJwtGuard)
  plan(@CurrentMember() member: MemberPrincipal, @Param('id') id: string) {
    return this.portal.plan(member.churchId, member.id, id);
  }

  @Post('plans/:id/day/:dayNumber')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  planDay(
    @CurrentMember() member: MemberPrincipal,
    @Param('id') id: string,
    @Param('dayNumber') dayNumber: string,
  ) {
    return this.portal.togglePlanDay(
      member.churchId,
      member.id,
      id,
      Number(dayNumber),
    );
  }
}
