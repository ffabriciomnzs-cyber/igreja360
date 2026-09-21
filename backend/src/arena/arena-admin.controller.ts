import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { SeasonsService } from './seasons.service';
import { FlashService } from './flash.service';
import { MissionsService } from './missions.service';

class OpcoesDto {
  @IsArray()
  @IsString({ each: true })
  themes!: string[];
}

class FlashDto {
  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(60)
  windowMin?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  questions?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  bonus?: number;
}

class MissaoDto {
  @IsString()
  title!: string;

  @IsString()
  kind!: string;

  @IsInt()
  @Min(1)
  target!: number;

  @IsOptional()
  @IsString()
  startDay?: string;

  @IsOptional()
  @IsString()
  endDay?: string;

  @IsOptional()
  @IsString()
  reward?: string;
}

/**
 * Painel da Arena. Quem cuida do engajamento é a mesma gente que cuida do
 * culto, então a permissão acompanha a de comunicados — não há papel novo
 * só para isto.
 */
const GERE = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
];

@Controller('arena')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GERE)
export class ArenaAdminController {
  constructor(
    private readonly seasons: SeasonsService,
    private readonly flash: FlashService,
    private readonly missions: MissionsService,
  ) {}

  /** Tudo o que a tela do painel precisa, numa chamada só. */
  @Get('overview')
  async overview(@CurrentUser() user: AuthUser) {
    const [temporada, votacao, historico, surpresas, missoes] = await Promise.all([
      this.seasons.temporadaAtual(user.churchId),
      this.seasons.votacaoAtual(user.churchId),
      this.seasons.historico(user.churchId),
      this.flash.listar(user.churchId),
      this.missions.listar(user.churchId),
    ]);
    return {
      themes: this.seasons.listaDeTemas(),
      season: temporada,
      poll: votacao,
      history: historico,
      flashes: surpresas,
      missions: missoes,
    };
  }

  @Put('poll/options')
  opcoes(@CurrentUser() user: AuthUser, @Body() dto: OpcoesDto) {
    return this.seasons.defineOpcoes(user.churchId, dto.themes);
  }

  @Post('flash')
  criaFlash(@CurrentUser() user: AuthUser, @Body() dto: FlashDto) {
    return this.flash.criar(user.churchId, dto);
  }

  @Delete('flash/:id')
  @HttpCode(200)
  apagaFlash(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.flash.remover(user.churchId, id);
  }

  @Post('missions')
  criaMissao(@CurrentUser() user: AuthUser, @Body() dto: MissaoDto) {
    return this.missions.criar(user.churchId, dto);
  }

  @Delete('missions/:id')
  @HttpCode(200)
  apagaMissao(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.missions.remover(user.churchId, id);
  }
}
