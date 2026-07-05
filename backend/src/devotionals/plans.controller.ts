import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PlansService } from './plans.service';
import { UpsertPlanDto } from './dto/upsert-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

@Controller('devotional-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.plans.list(user.churchId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plans.get(user.churchId, id);
  }

  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertPlanDto) {
    return this.plans.upsert(user.churchId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plans.remove(user.churchId, id);
  }
}
