import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  criarIgreja,
  prismaOf,
  resetDb,
  req,
  IgrejaFixture,
} from './helpers';

/**
 * Escola Bíblica (caderneta).
 *
 * O que a caderneta de papel garantia e o sistema não pode perder: a chamada
 * é por AULA (uma folha por domingo), não dá para marcar quem não é da turma,
 * e a chamada de uma igreja nunca aparece na outra.
 */
describe('Escola Bíblica', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb(prismaOf(app));
    A = await criarIgreja(app, 'Igreja A');
  });

  const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);

  async function criaTurma(nome = 'Jovens', token = A.adminToken) {
    const res = await req(app, 'POST', '/v1/school/classes', token, {
      name: nome,
      teacherName: 'Prof. Roberto',
      room: 'Sala 2',
    });
    return JSON.parse(res.body).find((t: { name: string }) => t.name === nome);
  }

  async function alunoNovo(nome: string) {
    return prismaOf(app).member.create({
      data: { churchId: A.churchId, name: nome, status: 'ACTIVE' },
    });
  }

  const caderneta = (classId: string, token = A.adminToken, day?: string) =>
    req(
      app,
      'GET',
      `/v1/school/classes/${classId}/lesson${day ? `?day=${day}` : ''}`,
      token,
    );

  describe('Turmas e matrícula', () => {
    it('cria turma com professor e sala', async () => {
      const turma = await criaTurma('Adultos I');
      expect(turma.name).toBe('Adultos I');
      expect(turma.teacherName).toBe('Prof. Roberto');
      expect(turma.room).toBe('Sala 2');
      expect(turma.enrolled).toBe(0);
    });

    it('matricula e não duplica ao repetir', async () => {
      const turma = await criaTurma();
      await req(app, 'POST', `/v1/school/classes/${turma.id}/enroll`, A.adminToken, {
        memberId: A.memberId,
      });
      const res = await req(
        app,
        'POST',
        `/v1/school/classes/${turma.id}/enroll`,
        A.adminToken,
        { memberId: A.memberId },
      );
      const atualizada = JSON.parse(res.body).find(
        (t: { id: string }) => t.id === turma.id,
      );
      expect(atualizada.enrolled).toBe(1);
      expect(await prismaOf(app).classEnrollment.count()).toBe(1);
    });

    it('não matricula aluno de outra igreja', async () => {
      const turma = await criaTurma();
      const B = await criarIgreja(app, 'Igreja B');
      const res = await req(
        app,
        'POST',
        `/v1/school/classes/${turma.id}/enroll`,
        A.adminToken,
        { memberId: B.memberId },
      );
      expect(res.statusCode).toBe(404);
      expect(await prismaOf(app).classEnrollment.count()).toBe(0);
    });
  });

  describe('Chamada', () => {
    it('abre a folha do dia sozinha, com a lista de matriculados', async () => {
      const turma = await criaTurma();
      const ana = await alunoNovo('Ana Clara');
      await req(app, 'POST', `/v1/school/classes/${turma.id}/enroll`, A.adminToken, {
        memberId: ana.id,
      });

      const res = await caderneta(turma.id);
      expect(res.statusCode).toBe(200);
      const folha = JSON.parse(res.body);
      expect(folha.day).toBe(hoje);
      expect(folha.enrolled).toBe(1);
      expect(folha.present).toBe(0);
      expect(folha.roll[0].name).toBe('Ana Clara');
      expect(folha.roll[0].present).toBe(false);
      // Abrir a caderneta não cria duas aulas para o mesmo dia.
      await caderneta(turma.id);
      expect(await prismaOf(app).classLesson.count()).toBe(1);
    });

    it('um toque marca, outro desmarca', async () => {
      const turma = await criaTurma();
      await req(app, 'POST', `/v1/school/classes/${turma.id}/enroll`, A.adminToken, {
        memberId: A.memberId,
      });
      const folha = JSON.parse((await caderneta(turma.id)).body);

      const marca = await req(
        app,
        'POST',
        `/v1/school/lessons/${folha.lessonId}/attendance/${A.memberId}`,
        A.adminToken,
      );
      expect(JSON.parse(marca.body).present).toBe(1);

      const desmarca = await req(
        app,
        'POST',
        `/v1/school/lessons/${folha.lessonId}/attendance/${A.memberId}`,
        A.adminToken,
      );
      expect(JSON.parse(desmarca.body).present).toBe(0);
      expect(await prismaOf(app).classAttendance.count()).toBe(0);
    });

    it('recusa marcar quem NÃO está matriculado na turma', async () => {
      const turma = await criaTurma();
      const forasteiro = await alunoNovo('Não Matriculado');
      const folha = JSON.parse((await caderneta(turma.id)).body);

      const res = await req(
        app,
        'POST',
        `/v1/school/lessons/${folha.lessonId}/attendance/${forasteiro.id}`,
        A.adminToken,
      );
      expect(res.statusCode).toBe(400);
      expect(await prismaOf(app).classAttendance.count()).toBe(0);
    });

    it('cada domingo é uma folha separada', async () => {
      const turma = await criaTurma();
      await req(app, 'POST', `/v1/school/classes/${turma.id}/enroll`, A.adminToken, {
        memberId: A.memberId,
      });
      const domingoPassado = '2026-08-23';

      const folhaHoje = JSON.parse((await caderneta(turma.id)).body);
      await req(
        app,
        'POST',
        `/v1/school/lessons/${folhaHoje.lessonId}/attendance/${A.memberId}`,
        A.adminToken,
      );

      const folhaAntiga = JSON.parse(
        (await caderneta(turma.id, A.adminToken, domingoPassado)).body,
      );
      expect(folhaAntiga.lessonId).not.toBe(folhaHoje.lessonId);
      expect(folhaAntiga.present).toBe(0); // a presença de hoje não vaza
      expect(await prismaOf(app).classLesson.count()).toBe(2);
    });

    it('guarda o assunto da aula', async () => {
      const turma = await criaTurma();
      const folha = JSON.parse((await caderneta(turma.id)).body);
      const res = await req(
        app,
        'PATCH',
        `/v1/school/lessons/${folha.lessonId}`,
        A.adminToken,
        { topic: 'O bom pastor', note: 'Turma cheia hoje' },
      );
      expect(JSON.parse(res.body).topic).toBe('O bom pastor');
    });
  });

  describe('Portal e isolamento', () => {
    it('o aluno vê a própria turma e o professor', async () => {
      const turma = await criaTurma('Jovens');
      await req(app, 'POST', `/v1/school/classes/${turma.id}/enroll`, A.adminToken, {
        memberId: A.memberId,
      });

      const minhas = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/school', A.memberToken)).body,
      );
      expect(minhas).toHaveLength(1);
      expect(minhas[0].name).toBe('Jovens');
      expect(minhas[0].teacherName).toBe('Prof. Roberto');
      expect(minhas[0].room).toBe('Sala 2');
    });

    it('a turma de uma igreja não aparece na outra', async () => {
      const turma = await criaTurma();
      const B = await criarIgreja(app, 'Igreja B');

      expect(
        JSON.parse((await req(app, 'GET', '/v1/school/classes', B.adminToken)).body),
      ).toHaveLength(0);
      expect((await caderneta(turma.id, B.adminToken)).statusCode).toBe(404);
    });

    it('membro do portal não faz chamada', async () => {
      expect(
        (await req(app, 'GET', '/v1/school/classes', A.memberToken)).statusCode,
      ).toBe(401);
    });
  });
});
