import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateChurchDto } from './dto/update-church.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ServiceSchedulesDto } from './dto/service-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('church')
  getChurch(@CurrentUser() user: AuthUser) {
    return this.settingsService.getChurch(user.churchId);
  }

  @Patch('church')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR)
  updateChurch(@CurrentUser() user: AuthUser, @Body() dto: UpdateChurchDto) {
    return this.settingsService.updateChurch(user.churchId, dto);
  }

  @Get('service-schedules')
  getSchedules(@CurrentUser() user: AuthUser) {
    return this.settingsService.getSchedules(user.churchId);
  }

  @Put('service-schedules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR, UserRole.SECRETARY)
  putSchedules(
    @CurrentUser() user: AuthUser,
    @Body() dto: ServiceSchedulesDto,
  ) {
    return this.settingsService.replaceSchedules(user.churchId, dto.schedules);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(user.id, dto);
  }
}
