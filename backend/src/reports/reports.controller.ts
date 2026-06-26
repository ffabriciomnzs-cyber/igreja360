import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.TREASURER,
)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.reportsService.overview(user.churchId);
  }

  // === PESSOAS ===

  @Get('members')
  members(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('cellId') cellId?: string,
    @Query('role') role?: string,
  ) {
    return this.reportsService.members(user.churchId, status, cellId, role);
  }

  @Get('birthdays')
  birthdays(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: string,
    @Query('month') month?: string,
  ) {
    return this.reportsService.birthdays(
      user.churchId,
      type,
      month ? Number(month) : undefined,
    );
  }

  @Get('new-members')
  newMembers(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.newMembers(user.churchId, from, to);
  }

  @Get('members-by-cell')
  membersByCell(@CurrentUser() user: AuthUser) {
    return this.reportsService.membersByCell(user.churchId);
  }

  @Get('inactive-members')
  inactiveMembers(@CurrentUser() user: AuthUser) {
    return this.reportsService.inactiveMembers(user.churchId);
  }

  @Get('members-by-city')
  membersByCity(@CurrentUser() user: AuthUser) {
    return this.reportsService.membersByCity(user.churchId);
  }

  // === FINANCEIRO ===

  @Get('financial')
  financial(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.financial(user.churchId, from, to);
  }

  @Get('cashflow')
  cashflow(@CurrentUser() user: AuthUser, @Query('months') months?: string) {
    return this.reportsService.cashflow(
      user.churchId,
      months ? Number(months) : undefined,
    );
  }

  // === CÉLULAS ===

  @Get('cells')
  cells(@CurrentUser() user: AuthUser) {
    return this.reportsService.cells(user.churchId);
  }

  // === EVENTOS ===

  @Get('events')
  events(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.events(user.churchId, from, to);
  }

  // === CAMPANHAS ===

  @Get('campaigns')
  campaigns(@CurrentUser() user: AuthUser) {
    return this.reportsService.campaigns(user.churchId);
  }

  // === ORAÇÃO ===

  @Get('prayers')
  prayers(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.prayers(user.churchId, from, to);
  }
}
