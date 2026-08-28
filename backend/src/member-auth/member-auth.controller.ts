import {
  Body,
  Controller,
  Delete,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetRequestDto } from './dto/reset-request.dto';
import { NotifyPrefsDto } from './dto/notify-prefs.dto';
import { MemberJwtGuard, MemberPrincipal } from './member-jwt.guard';
import { CurrentMember } from './current-member.decorator';
import { PushService } from '../push/push.service';
import { BirthdaysService } from './birthdays.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TeamsService } from '../teams/teams.service';
import { SchoolService } from '../school/school.service';

@Controller('member-auth')
export class MemberAuthController {
  constructor(
    private readonly memberAuth: MemberAuthService,
    private readonly portal: PortalService,
    private readonly push: PushService,
    private readonly birthdays: BirthdaysService,
    private readonly attendance: AttendanceService,
    private readonly teams: TeamsService,
    private readonly school: SchoolService,
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

  @Get('events/:id')
  @UseGuards(MemberJwtGuard)
  event(@CurrentMember() member: MemberPrincipal, @Param('id') id: string) {
    return this.portal.event(member.churchId, id, member.id);
  }

  @Post('events/:id/register')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  registerForEvent(
    @CurrentMember() member: MemberPrincipal,
    @Param('id') id: string,
  ) {
    return this.portal.registerForEvent(member.churchId, member.id, id);
  }

  @Delete('events/:id/register')
  @UseGuards(MemberJwtGuard)
  cancelEventRegistration(
    @CurrentMember() member: MemberPrincipal,
    @Param('id') id: string,
  ) {
    return this.portal.cancelEventRegistration(member.churchId, member.id, id);
  }

  // Aniversariantes de hoje e da semana + os recados que EU recebi.
  @Get('birthdays')
  @UseGuards(MemberJwtGuard)
  listBirthdays(@CurrentMember() member: MemberPrincipal) {
    return this.birthdays.list(member.churchId, member.id);
  }

  @Post('birthdays/:memberId/greet')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  greet(
    @CurrentMember() member: MemberPrincipal,
    @Param('memberId') memberId: string,
    @Body() body: { message?: string },
  ) {
    return this.birthdays.greet(
      member.churchId,
      member.id,
      memberId,
      body?.message,
    );
  }

  // Um número por vez, e só no dia do aniversário (ver birthdays.service).
  @Get('birthdays/:memberId/whatsapp')
  @UseGuards(MemberJwtGuard)
  whatsapp(
    @CurrentMember() member: MemberPrincipal,
    @Param('memberId') memberId: string,
  ) {
    return this.birthdays.whatsappLink(member.churchId, memberId);
  }

  // "Estou aqui": o botão só abre na janela do culto (ver attendance.service).
  @Get('attendance')
  @UseGuards(MemberJwtGuard)
  attendanceStatus(@CurrentMember() member: MemberPrincipal) {
    return this.attendance.statusDoMembro(member.churchId, member.id);
  }

  @Post('attendance')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  checkIn(@CurrentMember() member: MemberPrincipal) {
    return this.attendance.checkIn(member.churchId, member.id);
  }

  // Minha escala: onde e quando eu sirvo, e a confirmação.
  @Get('schedule')
  @UseGuards(MemberJwtGuard)
  mySchedule(@CurrentMember() member: MemberPrincipal) {
    return this.teams.mySchedule(member.churchId, member.id);
  }

  @Post('schedule/:id/respond')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  respondSchedule(
    @CurrentMember() member: MemberPrincipal,
    @Param('id') id: string,
    @Body() body: { confirm?: boolean },
  ) {
    return this.teams.respond(member.churchId, member.id, id, !!body?.confirm);
  }

  // Minha turma na Escola Bíblica.
  @Get('school')
  @UseGuards(MemberJwtGuard)
  mySchool(@CurrentMember() member: MemberPrincipal) {
    return this.school.myClasses(member.churchId, member.id);
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

  @Post('devotional/trail')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  startTrail(
    @CurrentMember() member: MemberPrincipal,
    @Body() body: { trailId?: string },
  ) {
    return this.portal.startTrail(
      member.churchId,
      member.id,
      String(body?.trailId ?? ''),
    );
  }

  @Delete('devotional/trail')
  @UseGuards(MemberJwtGuard)
  leaveTrail(@CurrentMember() member: MemberPrincipal) {
    return this.portal.leaveTrail(member.id);
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

  @Throttle(THROTTLE_LOGIN)
  @Post('password-reset-request')
  @HttpCode(200)
  requestPasswordReset(@Body() dto: ResetRequestDto) {
    return this.memberAuth.requestPasswordReset(dto);
  }

  // Mesma cadência do login: dificulta tentativa de adivinhar a senha atual.
  @Throttle(THROTTLE_LOGIN)
  @Patch('password')
  @UseGuards(MemberJwtGuard)
  changePassword(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.memberAuth.changePassword(member.id, dto);
  }

  @Patch('profile')
  @UseGuards(MemberJwtGuard)
  updateProfile(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: UpdateMemberProfileDto,
  ) {
    return this.portal.updateProfile(member.id, dto);
  }

  // Mural da tela inicial: só pedidos compartilhados pela própria igreja.
  @Get('prayers/shared')
  @UseGuards(MemberJwtGuard)
  sharedPrayers(@CurrentMember() member: MemberPrincipal) {
    return this.portal.sharedPrayers(member.churchId, member.id);
  }

  // "Estou orando por você" — entra/sai do pedido de outro irmão.
  @Post('prayers/:id/praying')
  @HttpCode(200)
  @UseGuards(MemberJwtGuard)
  togglePraying(
    @CurrentMember() member: MemberPrincipal,
    @Param('id') id: string,
  ) {
    return this.portal.togglePrayerIntercession(member.churchId, member.id, id);
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
