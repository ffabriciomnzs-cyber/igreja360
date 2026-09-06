import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { ArenaService } from './arena.service';
import {
  MemberJwtGuard,
  MemberPrincipal,
} from '../member-auth/member-jwt.guard';
import { CurrentMember } from '../member-auth/current-member.decorator';

class ArenaOpenDto {
  @IsString()
  questionId!: string;
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
  constructor(private readonly arena: ArenaService) {}

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
