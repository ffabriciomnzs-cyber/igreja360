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
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.membersService.stats(user.churchId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryMembersDto) {
    return this.membersService.findAll(user.churchId, query);
  }

  @Get(':id/card')
  card(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membersService.card(user.churchId, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membersService.findOne(user.churchId, id);
  }

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PASTOR,
    UserRole.SECRETARY,
    UserRole.LEADER,
  )
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMemberDto) {
    return this.membersService.create(user.churchId, dto);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PASTOR,
    UserRole.SECRETARY,
    UserRole.LEADER,
  )
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(user.churchId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membersService.remove(user.churchId, id);
  }
}
