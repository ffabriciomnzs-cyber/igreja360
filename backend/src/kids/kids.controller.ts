import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { KidsService } from './kids.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

/**
 * Ministério infantil. Só quem trabalha com as crianças opera aqui — LEADER
 * entra porque é o perfil da equipe do Kids. Dado de criança não é conteúdo
 * de portal: NÃO existe rota de membro neste módulo, de propósito.
 */
const EQUIPE_KIDS = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('kids')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...EQUIPE_KIDS)
export class KidsController {
  constructor(private readonly kids: KidsService) {}

  @Get('children')
  children(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.kids.listChildren(user.churchId, search);
  }

  @Post('children')
  createChild(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      birthDate?: string;
      notes?: string;
      restrictions?: string;
      guardians?: { name: string; phone?: string; relation?: string }[];
    },
  ) {
    return this.kids.createChild(user.churchId, body);
  }

  @Delete('children/:id')
  removeChild(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kids.removeChild(user.churchId, id);
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    return this.kids.today(user.churchId);
  }

  @Post('checkin')
  @HttpCode(200)
  checkIn(
    @CurrentUser() user: AuthUser,
    @Body() body: { childId: string; checkedInBy: string; room?: string },
  ) {
    return this.kids.checkIn(user.churchId, user.id, body);
  }

  @Post('checkout')
  @HttpCode(200)
  checkOut(
    @CurrentUser() user: AuthUser,
    @Body() body: { code: string; checkedOutBy: string },
  ) {
    return this.kids.checkOut(user.churchId, user.id, body);
  }
}
