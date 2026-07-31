import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  criarIgreja,
  prismaOf,
  resetDb,
  req,
  IgrejaFixture,
} from './helpers';
import { QUESTIONS } from '../src/arena/questions';

interface TodayQuestion {
  id: string;
  question: string;
  options: string[];
  answered: { correct: boolean; points: number; answer: number } | null;
}

/**
 * Arena Bíblica. Riscos a travar:
 *  1) trapaça — o gabarito NÃO pode viajar para o cliente antes da resposta,
 *     e responder duas vezes ou responder pergunta de fora do dia é bloqueado;
 *  2) isolamento — ranking de uma igreja nunca mostra membro de outra.
 */
describe('Arena Bíblica', () => {
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

  async function hoje(token = A.memberToken) {
    const res = await req(app, 'GET', '/v1/member-auth/arena/today', token);
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.body) as {
      day: string;
      questions: TodayQuestion[];
    };
  }

  function gabarito(questionId: string): number {
    const q = QUESTIONS.find((x) => x.id === questionId);
    if (!q) throw new Error(`pergunta ${questionId} não existe no banco`);
    return q.answer;
  }

  describe('Desafio do dia', () => {
    it('devolve 5 perguntas SEM o gabarito', async () => {
      const { questions } = await hoje();
      expect(questions).toHaveLength(5);
      for (const q of questions) {
        expect(q.options).toHaveLength(4);
        expect(q.answered).toBeNull();
        // O campo `answer` não pode existir fora de `answered`.
        expect((q as unknown as Record<string, unknown>).answer).toBeUndefined();
        expect((q as unknown as Record<string, unknown>).ref).toBeUndefined();
      }
    });

    it('o corpo da resposta não contém o gabarito em nenhum lugar', async () => {
      const res = await req(
        app,
        'GET',
        '/v1/member-auth/arena/today',
        A.memberToken,
      );
      // Nenhuma chave "answer" ou "ref" solta no JSON antes de responder.
      expect(res.body).not.toContain('"answer"');
      expect(res.body).not.toContain('"ref"');
    });

    it('as perguntas são as mesmas para dois membros da mesma igreja no mesmo dia', async () => {
      const prisma = prismaOf(app);
      const bcrypt = await import('bcryptjs');
      await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'Segundo Membro',
          email: 'segundo@teste.local',
          passwordHash: await bcrypt.hash('Senha@12345', 4),
          portalStatus: 'APPROVED',
          status: 'ACTIVE',
        },
      });
      const login = await req(app, 'POST', '/v1/member-auth/login', undefined, {
        slug: A.slug,
        email: 'segundo@teste.local',
        password: 'Senha@12345',
      });
      const token2 = JSON.parse(login.body).accessToken as string;

      const a = await hoje();
      const b = await hoje(token2);
      expect(a.questions.map((q) => q.id)).toEqual(
        b.questions.map((q) => q.id),
      );
    });

    it('exige login de membro', async () => {
      const res = await req(app, 'GET', '/v1/member-auth/arena/today');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Responder', () => {
    it('acerto vale 10 pontos e só então revela gabarito e referência', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/answer',
        A.memberToken,
        { questionId: q.id, choice: gabarito(q.id) },
      );
      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.correct).toBe(true);
      expect(corpo.points).toBe(10);
      expect(corpo.answer).toBe(gabarito(q.id));
      expect(typeof corpo.ref).toBe('string');
    });

    it('erro vale 0 ponto', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      const errada = (gabarito(q.id) + 1) % 4;
      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/answer',
        A.memberToken,
        { questionId: q.id, choice: errada },
      );
      const corpo = JSON.parse(res.body);
      expect(corpo.correct).toBe(false);
      expect(corpo.points).toBe(0);
    });

    it('NÃO deixa responder a mesma pergunta duas vezes (sem farmar ponto)', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      const certa = gabarito(q.id);
      await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
        questionId: q.id,
        choice: certa,
      });
      const denovo = await req(
        app,
        'POST',
        '/v1/member-auth/arena/answer',
        A.memberToken,
        { questionId: q.id, choice: certa },
      );
      expect(denovo.statusCode).toBe(409);

      // E só existe UMA resposta gravada.
      const total = await prismaOf(app).arenaAnswer.count({
        where: { memberId: A.memberId },
      });
      expect(total).toBe(1);
    });

    it('NÃO aceita pergunta que não é do sorteio de hoje', async () => {
      const { questions } = await hoje();
      const idsDeHoje = new Set(questions.map((q) => q.id));
      const foraDoDia = QUESTIONS.find((q) => !idsDeHoje.has(q.id));
      expect(foraDoDia).toBeDefined();

      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/answer',
        A.memberToken,
        { questionId: foraDoDia!.id, choice: 0 },
      );
      expect(res.statusCode).toBe(400);
    });

    it('valida a alternativa (0 a 3)', async () => {
      const { questions } = await hoje();
      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/answer',
        A.memberToken,
        { questionId: questions[0].id, choice: 7 },
      );
      expect(res.statusCode).toBe(400);
    });

    it('depois de responder, o desafio de hoje mostra o resultado daquela pergunta', async () => {
      const antes = await hoje();
      const q = antes.questions[0];
      await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
        questionId: q.id,
        choice: gabarito(q.id),
      });
      const depois = await hoje();
      const respondida = depois.questions.find((x) => x.id === q.id);
      expect(respondida?.answered?.correct).toBe(true);
      expect(respondida?.answered?.points).toBe(10);
    });
  });

  describe('Ranking', () => {
    it('soma pontos e coloca quem acertou na frente', async () => {
      const { questions } = await hoje();
      // Membro A acerta 2 perguntas = 20 pontos.
      for (const q of questions.slice(0, 2)) {
        await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
          questionId: q.id,
          choice: gabarito(q.id),
        });
      }
      const res = await req(
        app,
        'GET',
        '/v1/member-auth/arena/ranking?period=month',
        A.memberToken,
      );
      expect(res.statusCode).toBe(200);
      const r = JSON.parse(res.body);
      expect(r.top[0].points).toBe(20);
      expect(r.top[0].me).toBe(true);
      expect(r.me.position).toBe(1);
      expect(r.me.points).toBe(20);
    });

    it('NÃO mistura igrejas: o ranking da B não vê pontos da A', async () => {
      const B = await criarIgreja(app, 'Igreja B');
      const { questions } = await hoje();
      await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
        questionId: questions[0].id,
        choice: gabarito(questions[0].id),
      });

      const res = await req(
        app,
        'GET',
        '/v1/member-auth/arena/ranking?period=all',
        B.memberToken,
      );
      const r = JSON.parse(res.body);
      expect(r.top).toHaveLength(0);
      expect(r.me.position).toBeNull();
    });
  });
});
