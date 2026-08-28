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
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

// Frequência é dado pastoral: quem cuida de pessoas enxerga.
const GESTAO = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GESTAO)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.attendance.stats(user.churchId);
  }

  @Get()
  doDia(@CurrentUser() user: AuthUser, @Query('day') day?: string) {
    return this.attendance.doDia(user.churchId, day);
  }

  @Post(':memberId')
  @HttpCode(200)
  marcar(
    @CurrentUser() user: AuthUser,
    @Param('memberId') memberId: string,
    @Body() body: { day?: string },
  ) {
    return this.attendance.marcarManual(
      user.churchId,
      user.id,
      memberId,
      body?.day,
    );
  }

  @Delete(':memberId')
  desmarcar(
    @CurrentUser() user: AuthUser,
    @Param('memberId') memberId: string,
    @Query('day') day?: string,
  ) {
    return this.attendance.desmarcar(user.churchId, memberId, day);
  }
}
