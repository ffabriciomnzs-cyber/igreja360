import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { CoursesService } from './courses.service';
import { CURSOS_HABILITADO } from './feature';

class CursoDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() needsPastor?: boolean;
}

class LicaoDto {
  @IsOptional() @IsString() id?: string;
  @IsString() title!: string;
  @IsString() content!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) bibleRefs?: string[];
  @IsOptional() @IsString() question?: string;
}

class ParDto {
  @IsOptional() @IsString() partnerId?: string;
}

class RegistroDto {
  @IsOptional() @IsBoolean() pastorTalk?: boolean;
  @IsOptional() @IsString() baptizedAt?: string;
}

/**
 * Painel dos cursos. A permissão acompanha a de comunicados — quem cuida do
 * ensino é a mesma gente. As reflexões dos alunos são material de
 * aconselhamento e só aparecem aqui dentro.
 */
const GERE = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
];

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GERE)
export class CoursesAdminController {
  constructor(private readonly courses: CoursesService) {}

  /** Enquanto a funcionalidade não é liberada, ela não existe para ninguém. */
  private exigeLigado(): void {
    if (!CURSOS_HABILITADO) throw new NotFoundException('Cannot GET /courses');
  }

  @Get()
  listar(@CurrentUser() u: AuthUser) {
    this.exigeLigado();
    return this.courses.listar(u.churchId);
  }

  @Get('templates')
  modelos() {
    this.exigeLigado();
    return this.courses.modelos();
  }

  @Post('templates/:id')
  criarDoModelo(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    this.exigeLigado();
    return this.courses.criarDoModelo(u.churchId, id);
  }

  @Patch(':id')
  atualizar(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: CursoDto,
  ) {
    this.exigeLigado();
    return this.courses.atualizarCurso(u.churchId, id, dto);
  }

  @Put(':id/lessons')
  salvarLicao(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: LicaoDto,
  ) {
    this.exigeLigado();
    return this.courses.salvarLicao(u.churchId, id, dto);
  }

  @Delete('lessons/:lessonId')
  @HttpCode(200)
  removerLicao(@CurrentUser() u: AuthUser, @Param('lessonId') lessonId: string) {
    this.exigeLigado();
    return this.courses.removerLicao(u.churchId, lessonId);
  }

  @Put('enrollments/:id/partner')
  definirPar(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: ParDto,
  ) {
    this.exigeLigado();
    return this.courses.definirPar(u.churchId, id, dto.partnerId ?? null);
  }

  @Put('enrollments/:id/registro')
  registrar(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegistroDto,
  ) {
    this.exigeLigado();
    return this.courses.registrar(u.churchId, id, dto);
  }

  @Get('enrollments/:id/reflections')
  reflexoes(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    this.exigeLigado();
    return this.courses.reflexoes(u.churchId, id);
  }
}

// ---------------------------------------------------------------------------

class LicaoFeitaDto {
  @IsOptional() @IsString() @MaxLength(4000) reflection?: string;
}

export { LicaoFeitaDto };
