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
    return this.arena.ranking(
      member.churchId,
      member.id,
      period === 'all' ? 'all' : 'month',
    );
  }
}
