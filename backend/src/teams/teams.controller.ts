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
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

// Líder de ministério também monta escala — é quem conhece a equipe.
const GESTAO = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GESTAO)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.teams.listTeams(user.churchId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: { name: string }) {
    return this.teams.createTeam(user.churchId, String(body?.name ?? ''));
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.teams.removeTeam(user.churchId, id);
  }

  @Post(':id/members')
  @HttpCode(200)
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { memberId: string; role?: string },
  ) {
    return this.teams.addMember(
      user.churchId,
      id,
      String(body?.memberId ?? ''),
      body?.role,
    );
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.teams.removeMember(user.churchId, id, memberId);
  }
}

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GESTAO)
export class ScheduleController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.teams.schedule(user.churchId, from, to);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { teamId: string; memberId: string; date: string; role?: string },
  ) {
    return this.teams.createSlot(user.churchId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.teams.removeSlot(user.churchId, id);
  }
}
