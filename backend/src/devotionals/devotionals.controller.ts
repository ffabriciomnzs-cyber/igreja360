import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DevotionalsService } from './devotionals.service';
import { UpsertDevotionalDto } from './dto/upsert-devotional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

@Controller('devotionals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
)
export class DevotionalsController {
  constructor(private readonly devotionals: DevotionalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.devotionals.list(user.churchId);
  }

  @Get(':date')
  getByDate(@CurrentUser() user: AuthUser, @Param('date') date: string) {
    return this.devotionals.getByDate(user.churchId, date);
  }

  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertDevotionalDto) {
    return this.devotionals.upsert(user.churchId, dto);
  }
}
