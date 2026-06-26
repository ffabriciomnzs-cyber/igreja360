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
import { CellsService } from './cells.service';
import { CreateCellDto } from './dto/create-cell.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { QueryCellsDto } from './dto/query-cells.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
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
  UserRole.LEADER,
];

@Controller('cells')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CellsController {
  constructor(private readonly cellsService: CellsService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.cellsService.stats(user.churchId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryCellsDto) {
    return this.cellsService.findAll(user.churchId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cellsService.findOne(user.churchId, id);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCellDto) {
    return this.cellsService.create(user.churchId, dto);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCellDto,
  ) {
    return this.cellsService.update(user.churchId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cellsService.remove(user.churchId, id);
  }

  @Post(':id/meetings')
  @Roles(...MANAGE_ROLES)
  addMeeting(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.cellsService.addMeeting(user.churchId, id, dto);
  }

  @Delete(':id/meetings/:meetingId')
  @Roles(...MANAGE_ROLES)
  removeMeeting(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('meetingId') meetingId: string,
  ) {
    return this.cellsService.removeMeeting(user.churchId, id, meetingId);
  }
}
