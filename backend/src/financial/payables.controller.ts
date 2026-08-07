import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PayablesService } from './payables.service';
import { CreatePayableDto, PayInstallmentDto } from './dto/payable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

// Mesma permissão do restante do Financeiro: quem vê o caixa cuida das contas.
const MANAGE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.TREASURER,
];

@Controller('payables')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGE_ROLES)
export class PayablesController {
  constructor(private readonly payables: PayablesService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.payables.stats(user.churchId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.payables.findAll(user.churchId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payables.findOne(user.churchId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePayableDto) {
    return this.payables.create(user.churchId, user.id, dto);
  }

  @Post('installments/:id/pay')
  @HttpCode(200)
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.payables.pay(user.churchId, id, dto, user.id);
  }

  @Post('installments/:id/unpay')
  @HttpCode(200)
  unpay(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payables.unpay(user.churchId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payables.remove(user.churchId, id);
  }
}
