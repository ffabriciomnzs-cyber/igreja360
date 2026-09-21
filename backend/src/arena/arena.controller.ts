import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArenaService } from './arena.service';
import { SeasonsService } from './seasons.service';
import { DuelsService } from './duels.service';
import { FlashService } from './flash.service';
import { MissionsService } from './missions.service';
import { ProgressService } from './progress.service';
import {
  MemberJwtGuard,
  MemberPrincipal,
} from '../member-auth/member-jwt.guard';
import { CurrentMember } from '../member-auth/current-member.decorator';

class ArenaOpenDto {
  @IsString()
  questionId!: string;
}

class VotoDto {
  @IsString()
  theme!: string;
}

class DueloRespostaDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(-1)
  @Max(3)
  choice!: number;
}

class NovoDueloDto {
  @IsOptional()
  @IsString()
  rematchOf?: string;

  @IsOptional()
  @IsString()
  opponentId?: string;
}

class ArenaAnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  choice!: number;
}

/** Arena Bíblica — desafio diário do portal do membro. */
@Controller('member-auth/arena')
@UseGuards(MemberJwtGuard)
export class ArenaController {
  constructor(
    private readonly arena: ArenaService,
    private readonly seasons: SeasonsService,
    private readonly duels: DuelsService,
    private readonly flash: FlashService,
    private readonly missions: MissionsService,
    private readonly progress: ProgressService,
  ) {}

  // ---------- Temporada e votação ----------

  @Get('season')
  season(@CurrentMember() m: MemberPrincipal) {
    return this.seasons.temporadaAtual(m.churchId);
  }

  @Get('poll')
  poll(@CurrentMember() m: MemberPrincipal) {
    return this.seasons.votacaoAtual(m.churchId, m.id);
  }

  @Post('poll/vote')
  @HttpCode(200)
  vote(@CurrentMember() m: MemberPrincipal, @Body() dto: VotoDto) {
    return this.seasons.votar(m.churchId, m.id, dto.theme);
  }

  /**
   * O pouco que a TELA INICIAL mostra, numa chamada só.
   *
   * A tela inicial é a mais visitada do portal; deixá-la disparar seis
   * requisições para caber um card seria pagar caro por pouco.
   */
  @Get('summary')
  async summary(@CurrentMember() m: MemberPrincipal) {
    const [temporada, progresso, duelos, flash] = await Promise.all([
      this.seasons.temporadaAtual(m.churchId),
      this.progress.meu(m.churchId, m.id),
      this.duels.meus(m.churchId, m.id),
      this.flash.emCartaz(m.churchId, m.id),
    ]);
    return {
      season: temporada,
      streak: progresso.streak,
      // O que de fato pede ação de quem está olhando: convite para decidir
      // ou partida esperando a resposta dele.
      myTurnDuels: duelos.received.length + duelos.playing.filter((d) => d.myTurn).length,
      flashOpen: !!flash && !flash.done,
    };
  }

  // ---------- Progresso, missão e destaques ----------

  @Get('progress')
  progresso(@CurrentMember() m: MemberPrincipal) {
    return this.progress.meu(m.churchId, m.id);
  }

  @Get('highlights')
  destaques(@CurrentMember() m: MemberPrincipal) {
    return this.progress.destaques(m.churchId);
  }

  @Get('mission')
  mission(@CurrentMember() m: MemberPrincipal) {
    return this.missions.atual(m.churchId);
  }

  // ---------- Desafio surpresa ----------

  @Get('flash')
  flashAtual(@CurrentMember() m: MemberPrincipal) {
    return this.flash.emCartaz(m.churchId, m.id);
  }

  @Post('flash/:id/join')
  @HttpCode(200)
  flashEntrar(@CurrentMember() m: MemberPrincipal, @Param('id') id: string) {
    return this.flash.entrar(m.churchId, m.id, id);
  }

  @Get('flash/:id')
  flashEstado(@CurrentMember() m: MemberPrincipal, @Param('id') id: string) {
    return this.flash.estado(m.churchId, m.id, id);
  }

  @Post('flash/:id/open')
  @HttpCode(200)
  flashAbrir(
    @CurrentMember() m: MemberPrincipal,
    @Param('id') id: string,
    @Body() dto: ArenaOpenDto,
  ) {
    return this.flash.abrirPergunta(m.churchId, m.id, id, dto.questionId);
  }

  @Post('flash/:id/answer')
  @HttpCode(200)
  flashResponder(
    @CurrentMember() m: MemberPrincipal,
    @Param('id') id: string,
    @Body() dto: DueloRespostaDto,
  ) {
    return this.flash.responder(m.churchId, m.id, id, dto.questionId, dto.choice);
  }

  // ---------- Desafio 1x1 ----------

  @Get('duels')
  meusDuelos(@CurrentMember() m: MemberPrincipal) {
    return this.duels.meus(m.churchId, m.id);
  }

  @Post('duels')
  @HttpCode(201)
  criaDuelo(@CurrentMember() m: MemberPrincipal, @Body() dto: NovoDueloDto) {
    return this.duels.criar(m.churchId, m.id, {
      rematchOf: dto.rematchOf,
      opponentId: dto.opponentId,
    });
  }

  /** Entrada pelo link compartilhado. */
  @Get('duels/token/:token')
  duelPorToken(@CurrentMember() m: MemberPrincipal, @Param('token') token: string) {
    return this.duels.abrirPeloToken(m.churchId, m.id, token);
  }

  @Post('duels/:id/accept')
  @HttpCode(200)
  aceitaDuelo(@CurrentMember() m: MemberPrincipal, @Param('id') id: string) {
    return this.duels.aceitar(m.churchId, m.id, id);
  }

  @Post('duels/:id/decline')
  @HttpCode(200)
  recusaDuelo(@CurrentMember() m: MemberPrincipal, @Param('id') id: string) {
    return this.duels.recusar(m.churchId, m.id, id);
  }

  @Post('duels/:id/open')
  @HttpCode(200)
  duelAbrir(
    @CurrentMember() m: MemberPrincipal,
    @Param('id') id: string,
    @Body() dto: ArenaOpenDto,
  ) {
    return this.duels.abrirPergunta(m.churchId, m.id, id, dto.questionId);
  }

  @Post('duels/:id/answer')
  @HttpCode(200)
  duelResponder(
    @CurrentMember() m: MemberPrincipal,
    @Param('id') id: string,
    @Body() dto: DueloRespostaDto,
  ) {
    return this.duels.responder(m.churchId, m.id, id, dto.questionId, dto.choice);
  }

  @Get('today')
  today(@CurrentMember() member: MemberPrincipal) {
    return this.arena.today(member.churchId, member.id);
  }

  /** Liga o cronômetro: o servidor grava a hora em que entregou a pergunta. */
  @Post('open')
  @HttpCode(200)
  open(@CurrentMember() member: MemberPrincipal, @Body() dto: ArenaOpenDto) {
    return this.arena.open(member.churchId, member.id, dto.questionId);
  }

  /** O tempo acabou sem resposta. */
  @Post('timeout')
  @HttpCode(200)
  timeout(@CurrentMember() member: MemberPrincipal, @Body() dto: ArenaOpenDto) {
    return this.arena.timeout(member.churchId, member.id, dto.questionId);
  }

  @Post('answer')
  @HttpCode(200)
  answer(
    @CurrentMember() member: MemberPrincipal,
    @Body() dto: ArenaAnswerDto,
  ) {
    return this.arena.answer(
      member.churchId,
      member.id,
      dto.questionId,
      dto.choice,
    );
  }

  @Get('ranking')
  ranking(
    @CurrentMember() member: MemberPrincipal,
    @Query('period') period?: string,
  ) {
    // 'month' ainda é aceito: o portal antigo pode continuar no ar por alguns
    // minutos depois de a API subir (os dois serviços sobem separados).
    return this.arena.ranking(
      member.churchId,
      member.id,
      period === 'all' ? 'all' : 'week',
    );
  }

  @Get('champion')
  champion(@CurrentMember() member: MemberPrincipal) {
    return this.arena.campeaoDaSemana(member.churchId);
  }
}
