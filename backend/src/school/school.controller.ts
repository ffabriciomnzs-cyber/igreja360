import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';

// O professor da EBD costuma ter perfil de líder — ele precisa fazer a chamada.
const GESTAO = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SECRETARY,
  UserRole.LEADER,
];

@Controller('school')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...GESTAO)
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  @Get('classes')
  list(@CurrentUser() user: AuthUser) {
    return this.school.listClasses(user.churchId);
  }

  @Post('classes')
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; teacherId?: string; teacherName?: string; room?: string },
  ) {
    return this.school.createClass(user.churchId, body);
  }

  @Delete('classes/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.school.removeClass(user.churchId, id);
  }

  @Post('classes/:id/enroll')
  @HttpCode(200)
  enroll(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { memberId: string },
  ) {
    return this.school.enroll(user.churchId, id, String(body?.memberId ?? ''));
  }

  @Delete('classes/:id/enroll/:memberId')
  unenroll(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.school.unenroll(user.churchId, id, memberId);
  }

  // A folha da caderneta do dia (cria a aula se ainda não existir).
  @Get('classes/:id/lesson')
  lesson(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('day') day?: string,
  ) {
    return this.school.lesson(user.churchId, id, day);
  }

  @Post('lessons/:lessonId/attendance/:memberId')
  @HttpCode(200)
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('lessonId') lessonId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.school.toggleAttendance(user.churchId, lessonId, memberId);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @CurrentUser() user: AuthUser,
    @Param('lessonId') lessonId: string,
    @Body() body: { topic?: string; note?: string },
  ) {
    return this.school.updateLesson(user.churchId, lessonId, body);
  }
}
