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
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.TREASURER,
];

@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGE_ROLES)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.financialService.stats(user.churchId);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.financialService.findAll(user.churchId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.financialService.findOne(user.churchId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.financialService.create(user.churchId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financialService.update(user.churchId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.financialService.remove(user.churchId, id);
  }
}
