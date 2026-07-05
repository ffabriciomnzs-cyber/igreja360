import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MemberAuthService } from './member-auth.service';
import { PortalService } from './portal.service';
import { MemberRegisterDto } from './dto/member-register.dto';
import { MemberLoginDto } from './dto/member-login.dto';
import { DevotionalNoteDto } from './dto/devotional-note.dto';
import { DevotionalReactDto } from './dto/devotional-react.dto';
import { MemberJwtGuard, MemberPrincipal } from './member-jwt.guard';
import { CurrentMember } from './current-member.decorator';

@Controller('member-auth')
export class MemberAuthController {
  constructor(
    private readonly memberAuth: MemberAuthService,
    private readonly portal: PortalService,
  ) {}

  @Get('church/:slug')
  churchInfo(@Param('slug') slug: string) {
    return this.memberAuth.churchInfo(slug);
  }

  @Post('register')
  register(@Body() dto: MemberRegisterDto) {
    return this.memberAuth.register(dto);
  }

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
