import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole, VisitorStatus } from '@prisma/client';
import { VisitorsService } from './visitors.service';
import {
  CreateVisitorDto,
  FollowUpDto,
  UpdateVisitorStatusDto,
} from './dto/visitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

/**
 * Cadastro PÚBLICO do visitante (o QR code do culto).
 *
 * Controller separado, sem guarda, exatamente como o do banner de evento —
 * a separação deixa explícito o que é aberto e impede que uma rota
 * administrativa fique pública por descuido.
 *
 * Limite de 20 cadastros por minuto por IP: um culto cheio cadastra muita
 * gente ao mesmo tempo (rede da igreja sai por um IP só), mas um robô
 * tentando inundar o banco esbarra no teto.
 */
@Controller('public/visitors')
export class PublicVisitorsController {
  constructor(private readonly visitors: VisitorsService) {}

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post(':slug')
  @HttpCode(200)
  selfRegister(@Param('slug') slug: string, @Body() dto: CreateVisitorDto) {
    return this.visitors.selfRegister(slug, dto);
  }
}

const GESTAO = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('visitors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GESTAO)
export class VisitorsController {
  constructor(private readonly visitors: VisitorsService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.visitors.stats(user.churchId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    const valido =
      status && (Object.values(VisitorStatus) as string[]).includes(status)
        ? (status as VisitorStatus)
        : undefined;
    return this.visitors.findAll(user.churchId, valido);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visitors.findOne(user.churchId, id);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisitorStatusDto,
  ) {
    return this.visitors.setStatus(user.churchId, id, dto.status);
  }

  @Post(':id/follow-up')
  @HttpCode(200)
  addFollowUp(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: FollowUpDto,
  ) {
    return this.visitors.addFollowUp(user.churchId, id, user.id, dto.note);
  }

  @Post(':id/convert')
  @HttpCode(200)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PASTOR,
    UserRole.SECRETARY,
  )
  convert(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visitors.convertToMember(user.churchId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visitors.remove(user.churchId, id);
  }
}
