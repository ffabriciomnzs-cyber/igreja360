import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrayersService } from './prayers.service';
import { CreatePrayerDto } from './dto/create-prayer.dto';
import { UpdatePrayerDto } from './dto/update-prayer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

const MANAGE = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('prayers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrayersController {
  constructor(private readonly service: PrayersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.findAll(user.churchId, status);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePrayerDto) {
    return this.service.create(user.churchId, dto);
  }

  @Patch(':id')
  @Roles(...MANAGE)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePrayerDto,
  ) {
    return this.service.update(user.churchId, id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.churchId, id);
  }
}
