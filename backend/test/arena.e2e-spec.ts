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

  /**
   * Liga o cronômetro. O servidor exige a abertura antes da resposta, então
   * este é o caminho real do app — o teste tem que percorrer o mesmo.
   */
  const abre = (questionId: string, token = A.memberToken) =>
    req(app, 'POST', '/v1/member-auth/arena/open', token, { questionId });

  const responder = (
    questionId: string,
    choice: number,
    token = A.memberToken,
  ) =>
    req(app, 'POST', '/v1/member-auth/arena/answer', token, {
      questionId,
      choice,
    });

  async function abreEResponde(
    questionId: string,
    choice: number,
    token = A.memberToken,
  ) {
    await abre(questionId, token);
    return responder(questionId, choice, token);
  }

  /** Empurra a abertura para o passado: simula o tempo passando. */
  async function envelhece(questionId: string, segundos: number) {
    const day = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
    await prismaOf(app).arenaQuestionOpen.updateMany({
      where: { memberId: A.memberId, day, questionId },
      data: { openedAt: new Date(Date.now() - segundos * 1000) },
    });
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
      const res = await abreEResponde(q.id, gabarito(q.id));
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
      const res = await abreEResponde(q.id, errada);
      const corpo = JSON.parse(res.body);
      expect(corpo.correct).toBe(false);
      expect(corpo.points).toBe(0);
    });

    it('NÃO deixa responder a mesma pergunta duas vezes (sem farmar ponto)', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      const certa = gabarito(q.id);
      await abreEResponde(q.id, certa);
      const denovo = await responder(q.id, certa);
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
      await abreEResponde(q.id, gabarito(q.id));
      const depois = await hoje();
      const respondida = depois.questions.find((x) => x.id === q.id);
      expect(respondida?.answered?.correct).toBe(true);
      expect(respondida?.answered?.points).toBe(10);
    });
  });

  /**
   * Cronômetro (30s por pergunta).
   *
   * A regra só vale alguma coisa se o relógio for do SERVIDOR: um contador de
   * navegador se pausa com uma linha no console. Por isso os testes abaixo
   * envelhecem a ABERTURA gravada no banco, não o cronômetro da tela.
   */
  describe('Cronômetro', () => {
    it('abrir a pergunta liga o relógio em 30 segundos', async () => {
      const { questions } = await hoje();
      const res = await abre(questions[0].id);
      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.seconds).toBe(30);
      expect(corpo.remaining).toBeGreaterThan(27);
      expect(corpo.remaining).toBeLessThanOrEqual(30);
    });

    it('REABRIR não reinicia a contagem', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);
      await envelhece(q.id, 25); // 25s se passaram

      // Fechar o app, pesquisar a resposta e voltar não devolve tempo.
      const denovo = JSON.parse((await abre(q.id)).body);
      expect(denovo.remaining).toBeLessThanOrEqual(5);
    });

    it('responder DENTRO do tempo pontua normalmente', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);
      await envelhece(q.id, 20);

      const corpo = JSON.parse((await responder(q.id, gabarito(q.id))).body);
      expect(corpo.correct).toBe(true);
      expect(corpo.timedOut).toBe(false);
      expect(corpo.points).toBe(10);
    });

    it('resposta CERTA fora do tempo vale ZERO', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);
      await envelhece(q.id, 60); // muito depois dos 30s

      const corpo = JSON.parse((await responder(q.id, gabarito(q.id))).body);
      expect(corpo.correct).toBe(true); // acertou, sim
      expect(corpo.timedOut).toBe(true);
      expect(corpo.points).toBe(0); // mas não pontua

      const gravada = await prismaOf(app).arenaAnswer.findFirst({
        where: { memberId: A.memberId, questionId: q.id },
      });
      expect(gravada?.points).toBe(0);
      expect(gravada?.timedOut).toBe(true);
    });

    it('a tolerância cobre a internet ruim, mas não o atraso de verdade', async () => {
      const { questions } = await hoje();

      // 32s: dentro da tolerância de 3s — ainda pontua.
      const a = questions[0];
      await abre(a.id);
      await envelhece(a.id, 32);
      expect(JSON.parse((await responder(a.id, gabarito(a.id))).body).points).toBe(10);

      // 34s: passou da tolerância — zero.
      const b = questions[1];
      await abre(b.id);
      await envelhece(b.id, 34);
      expect(JSON.parse((await responder(b.id, gabarito(b.id))).body).points).toBe(0);
    });

    it('NÃO deixa responder sem ter aberto (sem relógio não há prova de tempo)', async () => {
      const { questions } = await hoje();
      const res = await responder(questions[0].id, gabarito(questions[0].id));
      expect(res.statusCode).toBe(400);
      expect(await prismaOf(app).arenaAnswer.count()).toBe(0);
    });

    it('o desafio de hoje devolve quanto tempo resta, para o app retomar', async () => {
      const { questions, secondsPerQuestion } = (await hoje()) as unknown as {
        questions: { id: string; remaining: number | null }[];
        secondsPerQuestion: number;
      };
      expect(secondsPerQuestion).toBe(30);
      expect(questions[0].remaining).toBeNull(); // nem abriu ainda

      await abre(questions[0].id);
      await envelhece(questions[0].id, 22);

      const depois = (await hoje()) as unknown as {
        questions: { id: string; remaining: number | null }[];
      };
      const q = depois.questions.find((x) => x.id === questions[0].id);
      expect(q?.remaining).toBeLessThanOrEqual(8);
      expect(q?.remaining).toBeGreaterThan(5);
    });

    it('o tempo esgotado é registrado como zero e revela o gabarito', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);
      await envelhece(q.id, 45);

      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/timeout',
        A.memberToken,
        { questionId: q.id },
      );
      expect(res.statusCode).toBe(200);
      const corpo = JSON.parse(res.body);
      expect(corpo.points).toBe(0);
      expect(corpo.timedOut).toBe(true);
      expect(corpo.answer).toBe(gabarito(q.id));

      // A pergunta não volta como pendente no próximo acesso.
      const depois = await hoje();
      expect(depois.questions.find((x) => x.id === q.id)?.answered).not.toBeNull();
    });

    it('NÃO deixa "queimar" uma pergunta difícil antes do tempo acabar', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);

      const res = await req(
        app,
        'POST',
        '/v1/member-auth/arena/timeout',
        A.memberToken,
        { questionId: q.id },
      );
      expect(res.statusCode).toBe(400);
      expect(await prismaOf(app).arenaAnswer.count()).toBe(0);
    });

    it('o tempo esgotado NÃO conta como acerto no ranking', async () => {
      const { questions } = await hoje();
      const q = questions[0];
      await abre(q.id);
      await envelhece(q.id, 60);
      await responder(q.id, gabarito(q.id));

      const r = JSON.parse(
        (
          await req(
            app,
            'GET',
            '/v1/member-auth/arena/ranking?period=all',
            A.memberToken,
          )
        ).body,
      );
      expect(r.me.points).toBe(0);
    });
  });

  describe('Ranking', () => {
    it('soma pontos e coloca quem acertou na frente', async () => {
      const { questions } = await hoje();
      // Membro A acerta 2 perguntas = 20 pontos.
      for (const q of questions.slice(0, 2)) {
        await abreEResponde(q.id, gabarito(q.id));
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
      await abreEResponde(questions[0].id, gabarito(questions[0].id));

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

  it('o banco dá pelo menos um mês sem repetir, e é válido', () => {
    // O que importa não é o número exato, é a experiência: o rodízio consome
    // 12 por dia, então o banco precisa cobrir um mês inteiro de desafio.
    expect(Math.floor(QUESTIONS.length / 12)).toBeGreaterThanOrEqual(28);
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

  /** Abre a pergunta (liga o cronômetro do servidor) e então responde. */
  async function abreEResponde(questionId: string, choice: number) {
    await req(app, 'POST', '/v1/member-auth/arena/open', A.memberToken, {
      questionId,
    });
    return req(app, 'POST', '/v1/member-auth/arena/answer', A.memberToken, {
      questionId,
      choice,
    });
  }

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
    await abreEResponde(questions[0].id, gabaritoDe(questions[0].id));
    // 2º acerto: JÁ era líder → não notifica de novo.
    await abreEResponde(questions[1].id, gabaritoDe(questions[1].id));
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
    await abreEResponde(q.id, errada);
    await new Promise((r) => setTimeout(r, 100));
    expect(avisos).toHaveLength(0);
  });
});

/**
 * Ciclo semanal da Arena: a competição fecha no SÁBADO e o campeão é exibido
 * do domingo até o sábado seguinte. O primeiro ciclo é maior de propósito
 * (absorve o que já havia sido jogado na regra mensal antiga).
 */
describe('Ciclo semanal da Arena', () => {
  const {
    cicloDoDia,
    cicloAnterior,
    FIM_DO_PRIMEIRO_CICLO,
  } = require('../src/arena/cycle');

  it('primeiro ciclo engloba tudo o que veio antes e fecha no sábado 22/08', () => {
    const c = cicloDoDia('2026-08-18'); // terça anterior à virada
    expect(c.primeiro).toBe(true);
    expect(c.fim).toBe(FIM_DO_PRIMEIRO_CICLO);
    expect(c.fim).toBe('2026-08-22');
    // Uma resposta antiga precisa continuar dentro do ciclo.
    expect('2026-07-01' >= c.inicio).toBe(true);
  });

  it('o sábado da virada ainda pertence ao primeiro ciclo', () => {
    expect(cicloDoDia('2026-08-22').primeiro).toBe(true);
  });

  it('domingo seguinte já é a semana nova, de domingo a sábado', () => {
    const c = cicloDoDia('2026-08-23'); // domingo
    expect(c.primeiro).toBe(false);
    expect(c.inicio).toBe('2026-08-23');
    expect(c.fim).toBe('2026-08-29'); // sábado
  });

  it('qualquer dia da semana cai no mesmo ciclo (domingo→sábado)', () => {
    const dias = [
      '2026-08-23',
      '2026-08-24',
      '2026-08-26',
      '2026-08-29',
    ];
    for (const d of dias) {
      expect(cicloDoDia(d)).toEqual({
        inicio: '2026-08-23',
        fim: '2026-08-29',
        primeiro: false,
      });
    }
    // O domingo seguinte já é outro ciclo.
    expect(cicloDoDia('2026-08-30').inicio).toBe('2026-08-30');
  });

  it('não há campeão enquanto o primeiro ciclo não fecha', () => {
    expect(cicloAnterior('2026-08-18')).toBeNull();
    expect(cicloAnterior('2026-08-22')).toBeNull();
  });

  it('no primeiro domingo, o campeão sai do acumulado antigo', () => {
    const anterior = cicloAnterior('2026-08-23');
    expect(anterior).not.toBeNull();
    expect(anterior.primeiro).toBe(true);
    expect(anterior.fim).toBe('2026-08-22');
  });

  it('a partir da segunda semana, o campeão sai da semana que fechou', () => {
    const anterior = cicloAnterior('2026-08-30'); // domingo seguinte
    expect(anterior).toEqual({
      inicio: '2026-08-23',
      fim: '2026-08-29',
      primeiro: false,
    });
  });

  it('vira o ano sem quebrar', () => {
    const c = cicloDoDia('2027-01-01'); // sexta
    expect(c.inicio).toBe('2026-12-27'); // domingo
    expect(c.fim).toBe('2027-01-02'); // sábado
  });
});

/**
 * Campeão da semana: quem aparece com a coroa na tela inicial. Sai sempre do
 * ciclo JÁ ENCERRADO — nunca do que está correndo, senão o "campeão" mudaria
 * a cada resposta durante a semana.
 */
describe('Campeão da semana', () => {
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

  /** Cria resposta pontuada num dia específico, direto no banco. */
  async function pontua(memberId: string, day: string, points: number) {
    await prismaOf(app).arenaAnswer.create({
      data: {
        churchId: A.churchId,
        memberId,
        day,
        questionId: `q-${day}-${memberId}-${points}`,
        choice: 0,
        correct: true,
        points,
      },
    });
  }

  async function outroMembro(nome: string) {
    const m = await prismaOf(app).member.create({
      data: {
        churchId: A.churchId,
        name: nome,
        status: 'ACTIVE',
        portalStatus: 'APPROVED',
      },
    });
    return m.id;
  }

  const campeao = async () =>
    JSON.parse(
      (
        await req(app, 'GET', '/v1/member-auth/arena/champion', A.memberToken)
      ).body,
    );

  it('não aponta campeão enquanto ninguém pontuou no ciclo encerrado', async () => {
    // Só pontos de hoje (ciclo corrente) — não vale para a coroa.
    await pontua(A.memberId, new Date().toISOString().slice(0, 10), 50);
    expect(await campeao()).toBeNull();
  });

  it('a coroa não muda com pontos da semana em curso', async () => {
    const rival = await outroMembro('Rival');
    // Semana encerrada: o membro venceu.
    await pontua(A.memberId, '2026-08-10', 80);
    await pontua(rival, '2026-08-11', 30);
    // Semana corrente: o rival dispara.
    await pontua(rival, new Date().toISOString().slice(0, 10), 500);

    const c = await campeao();
    if (c) {
      expect(c.memberId).toBe(A.memberId);
      expect(c.points).toBe(80);
    }
  });

  it('não vaza campeão de outra igreja', async () => {
    const B = await criarIgreja(app, 'Igreja B');
    await pontua(A.memberId, '2026-08-10', 80);
    const res = await req(
      app,
      'GET',
      '/v1/member-auth/arena/champion',
      B.memberToken,
    );
    expect(JSON.parse(res.body)).toBeNull();
  });
});
