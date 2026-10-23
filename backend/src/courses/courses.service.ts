import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { MODELOS } from './templates';

/**
 * Cursos do app: batismo, noivos e o que a igreja criar.
 *
 * Duas decisões que explicam o resto:
 *
 * 1) O curso de casal tem UMA inscrição e DOIS progressos. A lição só conta
 *    como feita pelo casal quando os dois marcaram — é assim que o pastor
 *    enxerga o caso de um fazer e o outro não, que é justamente o que ele
 *    precisa saber antes de casar alguém.
 *
 * 2) Concluir o curso no app não conclui a preparação. Falta a conversa com o
 *    pastor, que só a liderança marca. O app prepara; quem recebe é gente.
 */
@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  // ---------- Portal do membro ----------

  /** Cursos publicados + o andamento de quem está olhando. */
  async meus(churchId: string, memberId: string) {
    const cursos = await this.prisma.course.findMany({
      where: { churchId, published: true },
      orderBy: { createdAt: 'asc' },
      include: {
        lessons: { select: { id: true }, orderBy: { position: 'asc' } },
        enrollments: {
          where: { OR: [{ memberId }, { partnerId: memberId }] },
          include: { progress: true },
        },
      },
    });

    return cursos.map((c) => {
      const inscricao = c.enrollments[0] ?? null;
      const minhas = inscricao
        ? new Set(
            inscricao.progress
              .filter((p) => p.memberId === memberId)
              .map((p) => p.lessonId),
          )
        : new Set<string>();
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        kind: c.kind,
        couple: c.couple,
        totalLessons: c.lessons.length,
        enrolled: !!inscricao,
        myDone: minhas.size,
        completedAt: inscricao?.completedAt ?? null,
        pastorTalkAt: inscricao?.pastorTalkAt ?? null,
      };
    });
  }

  async inscrever(churchId: string, memberId: string, courseId: string) {
    const curso = await this.prisma.course.findFirst({
      where: { id: courseId, churchId, published: true },
      select: { id: true },
    });
    if (!curso) throw new NotFoundException('Curso não encontrado.');

    const ja = await this.prisma.courseEnrollment.findFirst({
      where: { courseId, OR: [{ memberId }, { partnerId: memberId }] },
      select: { id: true },
    });
    if (ja) return this.detalhe(churchId, memberId, courseId);

    await this.prisma.courseEnrollment.create({
      data: { churchId, courseId, memberId },
    });
    return this.detalhe(churchId, memberId, courseId);
  }

  /** O curso aberto: lições na ordem, com o que já foi feito. */
  async detalhe(churchId: string, memberId: string, courseId: string) {
    const curso = await this.prisma.course.findFirst({
      where: { id: courseId, churchId, published: true },
      include: {
        lessons: { orderBy: { position: 'asc' } },
        enrollments: {
          where: { OR: [{ memberId }, { partnerId: memberId }] },
          include: {
            progress: true,
            member: { select: { id: true, name: true } },
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    const inscricao = curso.enrollments[0] ?? null;

    const feitasPor = (quem: string) =>
      new Set(
        (inscricao?.progress ?? [])
          .filter((p) => p.memberId === quem)
          .map((p) => p.lessonId),
      );
    const minhas = feitasPor(memberId);
    const outroId =
      inscricao && curso.couple
        ? inscricao.memberId === memberId
          ? inscricao.partnerId
          : inscricao.memberId
        : null;
    const doOutro = outroId ? feitasPor(outroId) : new Set<string>();

    return {
      id: curso.id,
      title: curso.title,
      description: curso.description,
      couple: curso.couple,
      needsPastor: curso.needsPastor,
      enrolled: !!inscricao,
      completedAt: inscricao?.completedAt ?? null,
      pastorTalkAt: inscricao?.pastorTalkAt ?? null,
      partnerName:
        outroId && inscricao
          ? inscricao.member.id === outroId
            ? inscricao.member.name
            : (inscricao.partner?.name ?? null)
          : null,
      lessons: curso.lessons.map((l) => {
        const meu = (inscricao?.progress ?? []).find(
          (p) => p.lessonId === l.id && p.memberId === memberId,
        );
        return {
          id: l.id,
          position: l.position,
          title: l.title,
          content: l.content,
          bibleRefs: l.bibleRefs,
          question: l.question,
          done: minhas.has(l.id),
          partnerDone: doOutro.has(l.id),
          // Só a própria reflexão volta para o app: o que o outro escreveu
          // é dele e da liderança.
          reflection: meu?.reflection ?? null,
        };
      }),
    };
  }

  /** Marca a lição como lida (e guarda a reflexão, se houver). */
  async concluirLicao(
    churchId: string,
    memberId: string,
    lessonId: string,
    reflection?: string,
  ) {
    const licao = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, churchId },
      select: { id: true, courseId: true },
    });
    if (!licao) throw new NotFoundException('Lição não encontrada.');

    const inscricao = await this.prisma.courseEnrollment.findFirst({
      where: {
        courseId: licao.courseId,
        OR: [{ memberId }, { partnerId: memberId }],
      },
    });
    if (!inscricao) {
      throw new BadRequestException('Inscreva-se no curso antes de começar.');
    }

    await this.prisma.courseProgress.upsert({
      where: {
        enrollmentId_lessonId_memberId: {
          enrollmentId: inscricao.id,
          lessonId,
          memberId,
        },
      },
      create: {
        churchId,
        enrollmentId: inscricao.id,
        lessonId,
        memberId,
        reflection: reflection?.trim() || null,
      },
      // Reler e reescrever a reflexão é permitido; refazer não duplica nada.
      update: reflection !== undefined ? { reflection: reflection.trim() || null } : {},
    });

    await this.fechaSeTerminou(inscricao.id);
    return this.detalhe(churchId, memberId, licao.courseId);
  }

  /**
   * Fecha a inscrição quando TODOS os participantes fizeram TODAS as lições.
   * Num curso de casal, um sozinho não conclui pelos dois.
   */
  private async fechaSeTerminou(enrollmentId: string): Promise<void> {
    const inscricao = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        progress: true,
        course: { include: { lessons: { select: { id: true } } } },
      },
    });
    if (!inscricao || inscricao.completedAt) return;

    const total = inscricao.course.lessons.length;
    if (!total) return;
    const participantes = [inscricao.memberId, inscricao.partnerId].filter(
      (x): x is string => !!x,
    );
    const todosFizeram = participantes.every(
      (quem) =>
        inscricao.progress.filter((p) => p.memberId === quem).length >= total,
    );
    // Curso de casal sem o par definido ainda não pode concluir.
    if (inscricao.course.couple && participantes.length < 2) return;
    if (!todosFizeram) return;

    await this.prisma.courseEnrollment.updateMany({
      where: { id: enrollmentId, completedAt: null },
      data: { completedAt: new Date() },
    });
    void this.avisaLideranca(enrollmentId).catch(() => undefined);
  }

  private async avisaLideranca(enrollmentId: string): Promise<void> {
    const inscricao = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { title: true } },
        member: { select: { name: true } },
      },
    });
    if (!inscricao) return;
    await this.push.notifyTreasury(inscricao.churchId, {
      title: '🎓 Curso concluído',
      body: `${inscricao.member.name} terminou "${inscricao.course.title}". Falta a conversa.`,
    });
  }

  // ---------- Painel ----------

  modelos() {
    return MODELOS.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      kind: m.kind,
      couple: m.couple,
      lessons: m.lessons.length,
    }));
  }

  /** Cria um curso a partir do modelo — como RASCUNHO, nunca publicado. */
  async criarDoModelo(churchId: string, modeloId: string) {
    const modelo = MODELOS.find((m) => m.id === modeloId);
    if (!modelo) throw new NotFoundException('Modelo não encontrado.');

    return this.prisma.course.create({
      data: {
        churchId,
        title: modelo.title,
        description: modelo.description,
        kind: modelo.kind,
        couple: modelo.couple,
        // Doutrina não entra no ar sem alguém da casa ler. Nasce fechado.
        published: false,
        lessons: {
          create: modelo.lessons.map((l, i) => ({
            churchId,
            position: i + 1,
            title: l.title,
            content: l.content,
            bibleRefs: l.bibleRefs,
            question: l.question ?? null,
          })),
        },
      },
      include: { lessons: { orderBy: { position: 'asc' } } },
    });
  }

  async listar(churchId: string) {
    const cursos = await this.prisma.course.findMany({
      where: { churchId },
      orderBy: { createdAt: 'asc' },
      include: {
        lessons: { orderBy: { position: 'asc' } },
        enrollments: {
          include: {
            progress: true,
            member: { select: { id: true, name: true, photo: true } },
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });

    return cursos.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      kind: c.kind,
      couple: c.couple,
      needsPastor: c.needsPastor,
      published: c.published,
      lessons: c.lessons,
      enrollments: c.enrollments.map((e) => {
        const feitas = (quem: string | null) =>
          quem ? e.progress.filter((p) => p.memberId === quem).length : 0;
        return {
          id: e.id,
          memberName: e.member.name,
          memberPhoto: e.member.photo,
          partnerName: e.partner?.name ?? null,
          partnerId: e.partnerId,
          done: feitas(e.memberId),
          partnerDone: feitas(e.partnerId),
          total: c.lessons.length,
          completedAt: e.completedAt,
          pastorTalkAt: e.pastorTalkAt,
          baptizedAt: e.baptizedAt,
        };
      }),
    }));
  }

  async atualizarCurso(
    churchId: string,
    id: string,
    dto: { title?: string; description?: string; published?: boolean; needsPastor?: boolean },
  ) {
    const curso = await this.prisma.course.findFirst({
      where: { id, churchId },
      include: { lessons: { select: { id: true } } },
    });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    if (dto.published && curso.lessons.length === 0) {
      throw new BadRequestException('Escreva ao menos uma lição antes de publicar.');
    }
    await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
        ...(dto.needsPastor !== undefined ? { needsPastor: dto.needsPastor } : {}),
      },
    });
    return this.listar(churchId);
  }

  async salvarLicao(
    churchId: string,
    courseId: string,
    dto: {
      id?: string;
      title: string;
      content: string;
      bibleRefs?: string[];
      question?: string;
    },
  ) {
    const curso = await this.prisma.course.findFirst({
      where: { id: courseId, churchId },
      include: { lessons: { select: { position: true } } },
    });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    if (!dto.title?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('Título e texto são obrigatórios.');
    }

    const dados = {
      title: dto.title.trim(),
      content: dto.content.trim(),
      bibleRefs: dto.bibleRefs ?? [],
      question: dto.question?.trim() || null,
    };

    if (dto.id) {
      await this.prisma.courseLesson.updateMany({
        where: { id: dto.id, courseId, churchId },
        data: dados,
      });
    } else {
      const ultima = Math.max(0, ...curso.lessons.map((l) => l.position));
      await this.prisma.courseLesson.create({
        data: { churchId, courseId, position: ultima + 1, ...dados },
      });
    }
    return this.listar(churchId);
  }

  async removerLicao(churchId: string, lessonId: string) {
    const licao = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, churchId },
      select: { id: true },
    });
    if (!licao) throw new NotFoundException('Lição não encontrada.');
    await this.prisma.courseLesson.delete({ where: { id: lessonId } });
    return this.listar(churchId);
  }

  /** Liga o par de um curso de casal. */
  async definirPar(churchId: string, enrollmentId: string, partnerId: string | null) {
    const inscricao = await this.prisma.courseEnrollment.findFirst({
      where: { id: enrollmentId, churchId },
      select: { id: true, memberId: true, courseId: true },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada.');
    if (partnerId) {
      if (partnerId === inscricao.memberId) {
        throw new BadRequestException('O par precisa ser outra pessoa.');
      }
      const membro = await this.prisma.member.findFirst({
        where: { id: partnerId, churchId },
        select: { id: true },
      });
      if (!membro) throw new NotFoundException('Membro não encontrado.');
      const jaInscrito = await this.prisma.courseEnrollment.findFirst({
        where: {
          courseId: inscricao.courseId,
          id: { not: enrollmentId },
          OR: [{ memberId: partnerId }, { partnerId }],
        },
        select: { id: true },
      });
      if (jaInscrito) {
        throw new BadRequestException('Essa pessoa já está inscrita neste curso.');
      }
    }
    await this.prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { partnerId },
    });
    await this.fechaSeTerminou(enrollmentId);
    return this.listar(churchId);
  }

  /** A conversa com o pastor, e o batismo quando houver. */
  async registrar(
    churchId: string,
    enrollmentId: string,
    dto: { pastorTalk?: boolean; baptizedAt?: string },
  ) {
    const inscricao = await this.prisma.courseEnrollment.findFirst({
      where: { id: enrollmentId, churchId },
      select: { id: true, memberId: true, partnerId: true },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada.');

    const data: { pastorTalkAt?: Date | null; baptizedAt?: Date } = {};
    if (dto.pastorTalk !== undefined) {
      data.pastorTalkAt = dto.pastorTalk ? new Date() : null;
    }
    if (dto.baptizedAt) {
      const quando = new Date(dto.baptizedAt);
      if (Number.isNaN(quando.getTime())) {
        throw new BadRequestException('Data inválida.');
      }
      data.baptizedAt = quando;
      // Fecha o ciclo: o cadastro do membro passa a ter a data do batismo, que
      // é o que alimenta o aniversário de batismo mais tarde.
      const quem = [inscricao.memberId, inscricao.partnerId].filter(
        (x): x is string => !!x,
      );
      await this.prisma.member.updateMany({
        where: { id: { in: quem }, churchId },
        data: { baptismDate: quando },
      });
    }
    await this.prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data,
    });
    return this.listar(churchId);
  }

  /** As reflexões de uma inscrição — material de aconselhamento. */
  async reflexoes(churchId: string, enrollmentId: string) {
    const inscricao = await this.prisma.courseEnrollment.findFirst({
      where: { id: enrollmentId, churchId },
      include: {
        member: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
        course: { include: { lessons: { orderBy: { position: 'asc' } } } },
        progress: true,
      },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada.');

    const nome = (id: string) =>
      id === inscricao.member.id
        ? inscricao.member.name
        : (inscricao.partner?.name ?? 'Par');

    return inscricao.course.lessons.map((l) => ({
      position: l.position,
      title: l.title,
      question: l.question,
      answers: inscricao.progress
        .filter((p) => p.lessonId === l.id && p.reflection)
        .map((p) => ({ name: nome(p.memberId), text: p.reflection })),
    }));
  }
}
