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
import { perguntasDoDia } from '../src/arena/arena.service';

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

  /**
   * Gabarito DO DIA: as alternativas chegam embaralhadas por (dia, igreja),
   * então o índice correto vem do sorteio do dia — não do banco cru.
   */
  function gabarito(questionId: string): number {
    const day = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
    const q = perguntasDoDia(day, A.churchId).find((x) => x.id === questionId);
    if (!q) throw new Error(`pergunta ${questionId} não está no dia de hoje`);
    return q.answer;
  }

  describe('Desafio do dia', () => {
    it('devolve 12 perguntas SEM o gabarito', async () => {
      const { questions } = await hoje();
      expect(questions).toHaveLength(12);
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

describe('Banco e rodízio de perguntas', () => {

  it('o banco tem 260 perguntas válidas e sem duplicatas', () => {
    expect(QUESTIONS.length).toBe(260);
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(QUESTIONS.length);
    const textos = new Set(QUESTIONS.map((q) => q.question));
    expect(textos.size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4); // alternativas não se repetem
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(3);
      expect(q.ref.length).toBeGreaterThan(2);
    }
  });

  it('não repete NENHUMA pergunta dentro de um ciclo inteiro (16 dias)', () => {
    // 200 perguntas / 12 por dia = ciclo de 16 dias. Dias do mesmo ciclo não
    // podem compartilhar pergunta — era exatamente o bug reclamado pelo
    // cliente no segundo dia de uso.
    const vistos = new Set<string>();
    const base = Date.parse('2026-09-02T00:00:00Z'); // dentro de um ciclo
    const diasPorCiclo = Math.floor(QUESTIONS.length / 12);
    const inicioCiclo =
      Math.floor(Math.floor(base / 86_400_000) / diasPorCiclo) *
      diasPorCiclo *
      86_400_000;
    for (let d = 0; d < diasPorCiclo; d++) {
      const day = new Date(inicioCiclo + d * 86_400_000)
        .toISOString()
        .slice(0, 10);
      for (const q of perguntasDoDia(day, 'igreja-x')) {
        expect(vistos.has(q.id)).toBe(false);
        vistos.add(q.id);
      }
    }
    expect(vistos.size).toBe(12 * diasPorCiclo);
  });

  it('igrejas diferentes recebem sorteios diferentes no mesmo dia', () => {
    const a = perguntasDoDia('2026-09-02', 'igreja-a').map((q) => q.id);
    const b = perguntasDoDia('2026-09-02', 'igreja-b').map((q) => q.id);
    expect(a).not.toEqual(b);
  });

  it('as alternativas vêm embaralhadas mas a correção continua certa', () => {
    const original = new Map(QUESTIONS.map((q) => [q.id, q]));
    let algumaOrdemMudou = false;
    for (const q of perguntasDoDia('2026-09-02', 'igreja-x')) {
      const banco = original.get(q.id)!;
      // mesmo conteúdo, possivelmente outra ordem
      expect([...q.options].sort()).toEqual([...banco.options].sort());
      // o índice remapeado aponta para o MESMO texto correto do banco
      expect(q.options[q.answer]).toBe(banco.options[banco.answer]);
      if (q.options.join('|') !== banco.options.join('|')) algumaOrdemMudou = true;
    }
    expect(algumaOrdemMudou).toBe(true);
  });
});

describe('Push de novo líder do mês', () => {
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

  function gabaritoDe(questionId: string): number {
    const day = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
    const q = perguntasDoDia(day, A.churchId).find((x) => x.id === questionId);
    if (!q) throw new Error('pergunta fora do dia');
    return q.answer;
  }

  it('notifica quando alguém assume o topo — e só na ULTRAPASSAGEM', async () => {
    const { PushService } = await import('../src/push/push.service');
    const push = app.get(PushService);
    const avisos: string[] = [];
    jest
      .spyOn(push, 'notifyChurch')
      .mockImplementation(async (_c, titulo, corpo, cat) => {
        avisos.push(`${cat}|${titulo}|${corpo}`);
      });

    const res = await req(
      app,
      'GET',
      '/v1/member-auth/arena/today',
      A.memberToken,
    );
    const questions = JSON.parse(res.body).questions as { id: string }[];

    // 1º acerto: vira o primeiro líder do mês → notifica.
    await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
      questionId: questions[0].id,
      choice: gabaritoDe(questions[0].id),
    });
    // 2º acerto: JÁ era líder → não notifica de novo.
    await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
      questionId: questions[1].id,
      choice: gabaritoDe(questions[1].id),
    });
    // O aviso é disparado sem bloquear a resposta: dá um instante.
    await new Promise((r) => setTimeout(r, 100));

    const doLider = avisos.filter((a) => a.startsWith('arena|'));
    expect(doLider).toHaveLength(1);
    expect(doLider[0]).toContain('Novo líder');
    expect(doLider[0]).toContain('Membro Igreja A');
  });

  it('erro não dispara aviso de líder', async () => {
    const { PushService } = await import('../src/push/push.service');
    const push = app.get(PushService);
    const avisos: string[] = [];
    jest
      .spyOn(push, 'notifyChurch')
      .mockImplementation(async (_c, t) => {
        avisos.push(t);
      });

    const res = await req(
      app,
      'GET',
      '/v1/member-auth/arena/today',
      A.memberToken,
    );
    const q = (JSON.parse(res.body).questions as { id: string }[])[0];
    const errada = (gabaritoDe(q.id) + 1) % 4;
    await req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
      questionId: q.id,
      choice: errada,
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(avisos).toHaveLength(0);
  });
});
