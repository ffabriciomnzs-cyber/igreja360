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
import { WorshipService } from './worship.service';
import { WorshipAiService } from './worship-ai.service';
import { CreateWorshipDto } from './dto/create-worship.dto';
import { UpdateWorshipDto } from './dto/update-worship.dto';
import { QueryWorshipDto } from './dto/query-worship.dto';
import { SuggestWorshipDto } from './dto/suggest-worship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
];

@Controller('worship')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorshipController {
  constructor(
    private readonly worshipService: WorshipService,
    private readonly worshipAiService: WorshipAiService,
  ) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.worshipService.stats(user.churchId);
  }

  @Post('assist')
  @Roles(...MANAGE_ROLES)
  assist(@Body() dto: SuggestWorshipDto) {
    return this.worshipAiService.suggest(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryWorshipDto) {
    return this.worshipService.findAll(user.churchId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.worshipService.findOne(user.churchId, id);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorshipDto) {
    return this.worshipService.create(user.churchId, dto);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorshipDto,
  ) {
    return this.worshipService.update(user.churchId, id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.worshipService.remove(user.churchId, id);
  }
}
