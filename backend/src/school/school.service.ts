import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Escola Bíblica Dominical.
 *
 * Substitui a caderneta de papel: turma, professor, matrícula e chamada.
 * O professor abre a aula do domingo e toca no nome de quem veio — em pé,
 * no celular, antes de começar. Por isso a chamada é um toque por aluno,
 * sem formulário e sem botão de salvar.
 */

function hojeBrt(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Turmas ----------

  async listClasses(churchId: string) {
    const turmas = await this.prisma.schoolClass.findMany({
      where: { churchId },
      orderBy: { name: 'asc' },
      include: {
        enrollments: true,
        lessons: { orderBy: { day: 'desc' }, take: 4, include: { attendances: true } },
      },
    });
    if (!turmas.length) return [];

    // Nomes: alunos matriculados + professores que são membros.
    const ids = [
      ...new Set([
        ...turmas.flatMap((t) => t.enrollments.map((e) => e.memberId)),
        ...turmas.map((t) => t.teacherId).filter((x): x is string => !!x),
      ]),
    ];
    const membros = ids.length
      ? await this.prisma.member.findMany({
          where: { id: { in: ids }, churchId },
          select: { id: true, name: true, photo: true },
        })
      : [];
    const porId = new Map(membros.map((m) => [m.id, m]));

    return turmas.map((t) => {
      // Média de presença das últimas aulas — mostra se a turma está viva.
      const media = t.lessons.length
        ? Math.round(
            (t.lessons.reduce((soma, a) => soma + a.attendances.length, 0) /
              t.lessons.length) *
              10,
          ) / 10
        : 0;
      return {
        id: t.id,
        name: t.name,
        room: t.room,
        active: t.active,
        teacherName: t.teacherId
          ? (porId.get(t.teacherId)?.name ?? t.teacherName)
          : t.teacherName,
        teacherId: t.teacherId,
        enrolled: t.enrollments.length,
        students: t.enrollments.map((e) => ({
          memberId: e.memberId,
          name: porId.get(e.memberId)?.name ?? 'Membro',
          photo: porId.get(e.memberId)?.photo ?? null,
        })),
        lastLessons: t.lessons.map((a) => ({
          day: a.day,
          topic: a.topic,
          present: a.attendances.length,
        })),
        averageAttendance: media,
      };
    });
  }

  async createClass(
    churchId: string,
    dto: { name: string; teacherId?: string; teacherName?: string; room?: string },
  ) {
    const nome = dto.name?.trim() ?? '';
    if (nome.length < 2) throw new BadRequestException('Informe o nome da turma.');

    if (dto.teacherId) {
      const professor = await this.prisma.member.findFirst({
        where: { id: dto.teacherId, churchId },
        select: { id: true },
      });
      if (!professor) throw new NotFoundException('Professor não encontrado.');
    }

    await this.prisma.schoolClass.create({
      data: {
        churchId,
        name: nome,
        teacherId: dto.teacherId || null,
        teacherName: dto.teacherName?.trim() || null,
        room: dto.room?.trim() || null,
      },
    });
    return this.listClasses(churchId);
  }

  async removeClass(churchId: string, classId: string) {
    const turma = await this.prisma.schoolClass.findFirst({
      where: { id: classId, churchId },
      select: { id: true },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada.');
    await this.prisma.schoolClass.delete({ where: { id: classId } });
    return this.listClasses(churchId);
  }

  async enroll(churchId: string, classId: string, memberId: string) {
    const [turma, membro] = await Promise.all([
      this.prisma.schoolClass.findFirst({
        where: { id: classId, churchId },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: memberId, churchId },
        select: { id: true },
      }),
    ]);
    if (!turma || !membro) {
      throw new NotFoundException('Turma ou membro não encontrado.');
    }

    await this.prisma.classEnrollment.upsert({
      where: { classId_memberId: { classId, memberId } },
      create: { churchId, classId, memberId },
      update: {},
    });
    return this.listClasses(churchId);
  }

  async unenroll(churchId: string, classId: string, memberId: string) {
    await this.prisma.classEnrollment.deleteMany({
      where: { churchId, classId, memberId },
    });
    return this.listClasses(churchId);
  }

  // ---------- Caderneta ----------

  /**
   * A folha da caderneta: a aula do dia e a lista de matriculados, já
   * marcando quem foi. Se a aula ainda não existe, ela é criada aqui — o
   * professor não deveria precisar "abrir a aula" antes de fazer a chamada.
   */
  async lesson(churchId: string, classId: string, day?: string) {
    const dia = day ?? hojeBrt();
    const turma = await this.prisma.schoolClass.findFirst({
      where: { id: classId, churchId },
      include: { enrollments: true },
    });
    if (!turma) throw new NotFoundException('Turma não encontrada.');

    const aula = await this.prisma.classLesson.upsert({
      where: { classId_day: { classId, day: dia } },
      create: { churchId, classId, day: dia },
      update: {},
      include: { attendances: true },
    });

    const presentes = new Set(aula.attendances.map((a) => a.memberId));
    const membros = turma.enrollments.length
      ? await this.prisma.member.findMany({
          where: {
            id: { in: turma.enrollments.map((e) => e.memberId) },
            churchId,
          },
          select: { id: true, name: true, photo: true },
          orderBy: { name: 'asc' },
        })
      : [];

    return {
      lessonId: aula.id,
      classId,
      className: turma.name,
      day: dia,
      topic: aula.topic,
      note: aula.note,
      present: presentes.size,
      enrolled: membros.length,
      roll: membros.map((m) => ({
        memberId: m.id,
        name: m.name,
        photo: m.photo,
        present: presentes.has(m.id),
      })),
    };
  }

  /** Um toque no nome do aluno: marca ou desmarca a presença. */
  async toggleAttendance(churchId: string, lessonId: string, memberId: string) {
    const aula = await this.prisma.classLesson.findFirst({
      where: { id: lessonId, churchId },
      select: { id: true, classId: true, day: true },
    });
    if (!aula) throw new NotFoundException('Aula não encontrada.');

    const matriculado = await this.prisma.classEnrollment.findUnique({
      where: { classId_memberId: { classId: aula.classId, memberId } },
      select: { id: true },
    });
    if (!matriculado) {
      throw new BadRequestException('Este aluno não está matriculado na turma.');
    }

    const existente = await this.prisma.classAttendance.findUnique({
      where: { lessonId_memberId: { lessonId, memberId } },
      select: { id: true },
    });
    if (existente) {
      await this.prisma.classAttendance.delete({ where: { id: existente.id } });
    } else {
      await this.prisma.classAttendance.create({
        data: { churchId, lessonId, memberId },
      });
    }

    return this.lesson(churchId, aula.classId, aula.day);
  }

  /** Assunto e observação da aula (o que a caderneta de papel registrava). */
  async updateLesson(
    churchId: string,
    lessonId: string,
    dto: { topic?: string; note?: string },
  ) {
    const aula = await this.prisma.classLesson.findFirst({
      where: { id: lessonId, churchId },
      select: { id: true, classId: true, day: true },
    });
    if (!aula) throw new NotFoundException('Aula não encontrada.');

    await this.prisma.classLesson.update({
      where: { id: lessonId },
      data: {
        topic: dto.topic?.trim() || null,
        note: dto.note?.trim() || null,
      },
    });
    return this.lesson(churchId, aula.classId, aula.day);
  }

  // ---------- Portal do membro ----------

  /** "Minha turma na EBD" — turma, professor e sala. */
  async myClasses(churchId: string, memberId: string) {
    const matriculas = await this.prisma.classEnrollment.findMany({
      where: { churchId, memberId },
      include: { class: true },
    });
    if (!matriculas.length) return [];

    const professores = matriculas
      .map((m) => m.class.teacherId)
      .filter((x): x is string => !!x);
    const membros = professores.length
      ? await this.prisma.member.findMany({
          where: { id: { in: professores }, churchId },
          select: { id: true, name: true },
        })
      : [];
    const porId = new Map(membros.map((m) => [m.id, m.name]));

    return matriculas.map((m) => ({
      id: m.class.id,
      name: m.class.name,
      room: m.class.room,
      teacherName: m.class.teacherId
        ? (porId.get(m.class.teacherId) ?? m.class.teacherName)
        : m.class.teacherName,
    }));
  }
}
