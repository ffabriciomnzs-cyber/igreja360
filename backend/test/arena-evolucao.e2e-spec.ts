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
import { perguntasDoTema, porDiaDoTema } from '../src/arena/themes';
import { PERGUNTAS_POR_DIA } from '../src/arena/config';

/**
 * Evolução da Arena: temporadas, votação, duelo 1x1, surpresa, missão e
 * progresso. Os riscos que os testes seguram:
 *  1) o duelo vazar o gabarito (ou o placar do outro) antes da hora;
 *  2) o desafio surpresa aceitar quem chegou depois da janela;
 *  3) a votação aceitar dois votos da mesma pessoa;
 *  4) qualquer coisa disso encostar no ranking semanal, que é sagrado;
 *  5) uma igreja enxergar a Arena da outra.
 */
describe('Arena — temporadas, duelos e missões', () => {
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

  const get = (rota: string, token = A.memberToken) =>
    req(app, 'GET', `/v1/member-auth/arena/${rota}`, token);
  const post = (rota: string, corpo: unknown = {}, token = A.memberToken) =>
    req(app, 'POST', `/v1/member-auth/arena/${rota}`, token, corpo);

  /** Segundo membro da mesma igreja, para os duelos. */
  async function outroMembro(nome = 'Irmã Ana') {
    const bcrypt = await import('bcryptjs');
    const email = `${nome.replace(/\W/g, '').toLowerCase()}@teste.local`;
    await prismaOf(app).member.create({
      data: {
        churchId: A.churchId,
        name: nome,
        email,
        passwordHash: await bcrypt.hash('Senha@12345', 4),
        portalStatus: 'APPROVED',
        status: 'ACTIVE',
      },
    });
    const login = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug,
      email,
      password: 'Senha@12345',
    });
    return JSON.parse(login.body).accessToken as string;
  }

  describe('Temporada temática', () => {
    it('nasce sozinha no primeiro acesso da semana', async () => {
      const t = JSON.parse((await get('season')).body);
      expect(t.theme).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(await prismaOf(app).arenaSeason.count()).toBe(1);

      // Segundo acesso não cria outra.
      await get('season');
      expect(await prismaOf(app).arenaSeason.count()).toBe(1);
    });

    it('o tema aparece no desafio do dia e tempera as perguntas', async () => {
      const hoje = JSON.parse((await get('today')).body);
      expect(hoje.season.theme).toBeTruthy();
      expect(hoje.questions).toHaveLength(PERGUNTAS_POR_DIA);

      const doTema = new Set(
        perguntasDoTema(hoje.season.theme).map((q: { id: string }) => q.id),
      );
      const quantas = hoje.questions.filter((q: { id: string }) =>
        doTema.has(q.id),
      ).length;
      const esperado = porDiaDoTema(hoje.season.theme, PERGUNTAS_POR_DIA);
      expect(quantas).toBeGreaterThanOrEqual(esperado);
    });

    it('as perguntas do dia continuam sem gabarito', async () => {
      const res = await get('today');
      expect(res.body).not.toContain('"answer"');
      expect(res.body).not.toContain('"ref"');
    });
  });

  describe('Votação do próximo tema', () => {
    it('abre sozinha, com opções diferentes do tema em curso', async () => {
      const temporada = JSON.parse((await get('season')).body);
      const votacao = JSON.parse((await get('poll')).body);
      expect(votacao.options.length).toBeGreaterThanOrEqual(2);
      expect(votacao.options.map((o: { theme: string }) => o.theme)).not.toContain(
        temporada.theme,
      );
      expect(votacao.myVote).toBeNull();
    });

    it('vota uma vez; votar de novo TROCA em vez de somar', async () => {
      const votacao = JSON.parse((await get('poll')).body);
      const primeiro = votacao.options[0].theme;
      const segundo = votacao.options[1].theme;

      const r1 = JSON.parse((await post('poll/vote', { theme: primeiro })).body);
      expect(r1.myVote).toBe(primeiro);
      expect(r1.total).toBe(1);

      const r2 = JSON.parse((await post('poll/vote', { theme: segundo })).body);
      expect(r2.myVote).toBe(segundo);
      expect(r2.total).toBe(1); // continua UM voto
      expect(await prismaOf(app).arenaThemeVote.count()).toBe(1);
    });

    it('recusa voto em tema fora da lista', async () => {
      await get('poll');
      const res = await post('poll/vote', { theme: 'tema-inventado' });
      expect(res.statusCode).toBe(400);
    });

    it('o painel troca as opções e apaga votos órfãos', async () => {
      const votacao = JSON.parse((await get('poll')).body);
      await post('poll/vote', { theme: votacao.options[0].theme });
      expect(await prismaOf(app).arenaThemeVote.count()).toBe(1);

      const sobrando = votacao.options
        .slice(1)
        .map((o: { theme: string }) => o.theme);
      const res = await req(app, 'PUT', '/v1/arena/poll/options', A.adminToken, {
        themes: sobrando,
      });
      expect(res.statusCode).toBe(200);
      // O voto era num tema que saiu: não pode continuar contando.
      expect(await prismaOf(app).arenaThemeVote.count()).toBe(0);
    });
  });

  describe('Desafio 1x1', () => {
    async function duelo() {
      const criado = JSON.parse((await post('duels')).body);
      const tokenB = await outroMembro();
      const estado = JSON.parse(
        (await get(`duels/token/${criado.token}`, tokenB)).body,
      );
      return { token: criado.token, id: criado.id, tokenB, estado };
    }

    /** Joga a rodada inteira de um lado, acertando ou errando de propósito. */
    async function joga(id: string, token: string, acertar: boolean) {
      for (;;) {
        const estado = JSON.parse((await get(`duels/token/${id}`, token)).body);
        if (!estado.current) return estado;
        const q = estado.current;
        await post(`duels/${estado.id}/open`, { questionId: q.id }, token);
        // O gabarito não vem na listagem: descobre pelo texto da alternativa.
        const original = QUESTIONS.find((x) => x.id === q.id)!;
        const certa = q.options.indexOf(original.options[original.answer]);
        await post(
          `duels/${estado.id}/answer`,
          { questionId: q.id, choice: acertar ? certa : (certa + 1) % 4 },
          token,
        );
      }
    }

    it('cria o convite e quem abre o link vira o adversário', async () => {
      const d = await duelo();
      expect(d.estado.side).toBe('opponent');
      expect(d.estado.challenger.name).toContain('Membro');
      expect(d.estado.total).toBe(5);
    });

    it('NÃO entrega o gabarito na pergunta da vez', async () => {
      const criado = JSON.parse((await post('duels')).body);
      const res = await get(`duels/token/${criado.token}`);
      expect(res.body).not.toContain('"answer"');
      expect(res.body).not.toContain('"ref"');
    });

    it('o placar do adversário fica escondido enquanto ele não termina', async () => {
      const d = await duelo();
      await joga(d.token, A.memberToken, true); // desafiante acerta tudo
      const visto = JSON.parse((await get(`duels/token/${d.token}`, d.tokenB)).body);
      // Quem ainda vai jogar não pode ver quanto precisa fazer.
      expect(visto.challenger.score).toBe(5);
      expect(visto.opponent.score).toBeNull();
    });

    it('fecha com vencedor e guarda o histórico entre os dois', async () => {
      const d = await duelo();
      await joga(d.token, A.memberToken, true);
      const fim = await joga(d.token, d.tokenB, false);

      expect(fim.finished).toBe(true);
      expect(fim.winner).toBe('challenger');
      expect(fim.challenger.score).toBe(5);
      expect(fim.opponent.score).toBe(0);
      expect(fim.history).toEqual({ aWins: 1, bWins: 0, draws: 0 });
    });

    it('NÃO encosta no ranking semanal', async () => {
      const antes = JSON.parse((await get('ranking?period=all')).body);
      const d = await duelo();
      await joga(d.token, A.memberToken, true);
      await joga(d.token, d.tokenB, true);
      const depois = JSON.parse((await get('ranking?period=all')).body);

      expect(depois.me.points).toBe(antes.me.points);
      expect(await prismaOf(app).arenaAnswer.count()).toBe(0);
    });

    it('responder fora do tempo não pontua no duelo', async () => {
      const d = await duelo();
      const estado = JSON.parse((await get(`duels/token/${d.token}`)).body);
      const q = estado.current;
      await post(`duels/${estado.id}/open`, { questionId: q.id });
      await prismaOf(app).arenaRoundTurn.updateMany({
        where: { duelId: estado.id, memberId: A.memberId, questionId: q.id },
        data: { openedAt: new Date(Date.now() - 120_000) },
      });
      const original = QUESTIONS.find((x) => x.id === q.id)!;
      const certa = q.options.indexOf(original.options[original.answer]);
      const res = JSON.parse(
        (await post(`duels/${estado.id}/answer`, { questionId: q.id, choice: certa })).body,
      );
      expect(res.correct).toBe(false);
      expect(res.timedOut).toBe(true);
    });

    it('duelo de outra igreja não abre', async () => {
      const criado = JSON.parse((await post('duels')).body);
      const B = await criarIgreja(app, 'Igreja B');
      const res = await get(`duels/token/${criado.token}`, B.memberToken);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Desafio surpresa', () => {
    async function criaFlash(minutosAtras = 0, janela = 10) {
      return prismaOf(app).arenaFlash.create({
        data: {
          churchId: A.churchId,
          startsAt: new Date(Date.now() - minutosAtras * 60_000),
          windowMin: janela,
          questions: 3,
          bonus: 5,
        },
      });
    }

    it('aparece enquanto a janela está aberta', async () => {
      await criaFlash(2);
      const f = JSON.parse((await get('flash')).body);
      expect(f.joined).toBe(false);
      expect(f.secondsToEnter).toBeGreaterThan(0);
    });

    it('quem NÃO entrou some com a janela fechada', async () => {
      await criaFlash(30);
      const res = await get('flash');
      expect(res.body === '' || JSON.parse(res.body) === null).toBe(true);
    });

    it('RECUSA entrar depois dos 10 minutos', async () => {
      const flash = await criaFlash(11);
      const res = await post(`flash/${flash.id}/join`);
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('entrar');
    });

    it('quem entrou a tempo conclui com calma, mesmo depois da janela', async () => {
      const flash = await criaFlash(1);
      const entrou = JSON.parse((await post(`flash/${flash.id}/join`)).body);
      const q = entrou.current;
      await post(`flash/${flash.id}/open`, { questionId: q.id });

      // A janela fecha enquanto ele joga: não pode ser cortado no meio.
      await prismaOf(app).arenaFlash.update({
        where: { id: flash.id },
        data: { startsAt: new Date(Date.now() - 60 * 60_000) },
      });
      const original = QUESTIONS.find((x) => x.id === q.id)!;
      const res = await post(`flash/${flash.id}/answer`, {
        questionId: q.id,
        choice: original.answer,
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).correct).toBe(true);
    });

    it('NÃO encosta no ranking semanal', async () => {
      const flash = await criaFlash(1);
      const entrou = JSON.parse((await post(`flash/${flash.id}/join`)).body);
      const q = entrou.current;
      await post(`flash/${flash.id}/open`, { questionId: q.id });
      const original = QUESTIONS.find((x) => x.id === q.id)!;
      await post(`flash/${flash.id}/answer`, { questionId: q.id, choice: original.answer });
      expect(await prismaOf(app).arenaAnswer.count()).toBe(0);
    });
  });

  describe('Missão coletiva', () => {
    it('soma os acertos da igreja inteira e mostra o progresso', async () => {
      const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
      await req(app, 'POST', '/v1/arena/missions', A.adminToken, {
        title: 'Mil acertos juntos',
        kind: 'CORRECT',
        target: 1000,
      });
      for (let i = 0; i < 3; i++) {
        await prismaOf(app).arenaAnswer.create({
          data: {
            churchId: A.churchId,
            memberId: A.memberId,
            day: hoje,
            questionId: `m${i}`,
            choice: 0,
            correct: true,
            points: 10,
          },
        });
      }
      const m = JSON.parse((await get('mission')).body);
      expect(m.target).toBe(1000);
      expect(m.progress).toBe(3);
    });

    it('meta de RODADAS não conta quem parou no meio', async () => {
      await req(app, 'POST', '/v1/arena/missions', A.adminToken, {
        title: 'Cem Arenas juntos',
        kind: 'ROUNDS',
        target: 100,
      });
      const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
      // 11 respostas: rodada pela metade, não pode contar como Arena concluída.
      for (let i = 0; i < 11; i++) {
        await prismaOf(app).arenaAnswer.create({
          data: {
            churchId: A.churchId,
            memberId: A.memberId,
            day: hoje,
            questionId: `r${i}`,
            choice: 0,
            correct: true,
            points: 10,
          },
        });
      }
      expect(JSON.parse((await get('mission')).body).progress).toBe(0);

      // A 12ª fecha a rodada e ela passa a contar.
      await prismaOf(app).arenaAnswer.create({
        data: {
          churchId: A.churchId,
          memberId: A.memberId,
          day: hoje,
          questionId: 'r11',
          choice: 0,
          correct: true,
          points: 10,
        },
      });
      expect(JSON.parse((await get('mission')).body).progress).toBe(1);
    });

    it('a missão de uma igreja não conta o acerto da outra', async () => {
      await req(app, 'POST', '/v1/arena/missions', A.adminToken, {
        title: 'Juntos',
        kind: 'CORRECT',
        target: 10,
      });
      const B = await criarIgreja(app, 'Igreja B');
      const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
      await prismaOf(app).arenaAnswer.create({
        data: {
          churchId: B.churchId,
          memberId: B.memberId,
          day: hoje,
          questionId: 'x1',
          choice: 0,
          correct: true,
          points: 10,
        },
      });
      expect(JSON.parse((await get('mission')).body).progress).toBe(0);
    });
  });

  describe('Sequência e conquistas', () => {
    it('conta dias seguidos com a rodada fechada', async () => {
      const hoje = new Date(Date.now() - 3 * 3600_000);
      const dia = (delta: number) =>
        new Date(hoje.getTime() + delta * 86_400_000).toISOString().slice(0, 10);

      // Hoje e ontem completos; anteontem pela metade (quebra a sequência).
      for (const [d, quantas] of [
        [dia(0), 12],
        [dia(-1), 12],
        [dia(-2), 5],
      ] as [string, number][]) {
        for (let i = 0; i < quantas; i++) {
          await prismaOf(app).arenaAnswer.create({
            data: {
              churchId: A.churchId,
              memberId: A.memberId,
              day: d,
              questionId: `s${d}-${i}`,
              choice: 0,
              correct: true,
              points: 10,
            },
          });
        }
      }
      const p = JSON.parse((await get('progress')).body);
      expect(p.streak).toBe(2);
      expect(p.perfectRounds).toBe(2);
      expect(
        p.achievements.find((c: { id: string }) => c.id === 'perfeita').conquistada,
      ).toBe(true);
      expect(
        p.achievements.find((c: { id: string }) => c.id === 'fogo-7').conquistada,
      ).toBe(false);
    });
  });

  describe('Auditoria — o que a revisão encontrou', () => {
    it('o desafio do dia diz QUANTAS perguntas são do tema', async () => {
      const hoje = JSON.parse((await get('today')).body);
      // A tela promete só o que o acervo entrega; sem este número ela
      // anunciaria uma semana inteira temática que não acontece.
      expect(hoje.season.questionsTotal).toBe(PERGUNTAS_POR_DIA);
      expect(hoje.season.questionsFromTheme).toBeGreaterThanOrEqual(
        porDiaDoTema(hoje.season.theme, PERGUNTAS_POR_DIA),
      );
      expect(hoje.season.questionsFromTheme).toBeLessThanOrEqual(PERGUNTAS_POR_DIA);
    });

    it('no duelo, responder a MESMA pergunta duas vezes é recusado', async () => {
      const criado = JSON.parse((await post('duels')).body);
      const estado = JSON.parse((await get(`duels/token/${criado.token}`)).body);
      const q = estado.current;
      await post(`duels/${estado.id}/open`, { questionId: q.id });
      await post(`duels/${estado.id}/answer`, { questionId: q.id, choice: 0 });

      const denovo = await post(`duels/${estado.id}/answer`, {
        questionId: q.id,
        choice: 1,
      });
      expect(denovo.statusCode).toBe(409);
      // E reabrir para "tentar de novo" também não passa.
      const reabrir = await post(`duels/${estado.id}/open`, { questionId: q.id });
      expect(reabrir.statusCode).toBe(409);
    });

    it('um surpresa em andamento vem na frente de um novo', async () => {
      const antigo = await prismaOf(app).arenaFlash.create({
        data: {
          churchId: A.churchId,
          startsAt: new Date(Date.now() - 5 * 60_000),
          windowMin: 10,
          questions: 3,
          bonus: 5,
        },
      });
      const entrou = JSON.parse((await post(`flash/${antigo.id}/join`)).body);
      await post(`flash/${antigo.id}/open`, { questionId: entrou.current.id });

      // Abre outro depois: quem está no meio não pode perder o que jogava.
      await prismaOf(app).arenaFlash.create({
        data: {
          churchId: A.churchId,
          startsAt: new Date(),
          windowMin: 10,
          questions: 3,
          bonus: 5,
        },
      });
      const emCartaz = JSON.parse((await get('flash')).body);
      expect(emCartaz.id).toBe(antigo.id);
    });

    it('semanas seguidas atravessa o primeiro ciclo, que é maior que 7 dias', async () => {
      const { cicloDoDia, cicloAnterior } = await import('../src/arena/cycle');
      const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
      const atual = cicloDoDia(hoje);
      const anterior = cicloAnterior(hoje);
      if (!anterior) return;

      // Rodada fechada no ciclo atual e no anterior (que pode ser o primeiro,
      // com mais de 7 dias — andar de 7 em 7 pularia por cima dele).
      for (const dia of [hoje, anterior.fim]) {
        for (let i = 0; i < 12; i++) {
          await prismaOf(app).arenaAnswer.create({
            data: {
              churchId: A.churchId,
              memberId: A.memberId,
              day: dia,
              questionId: `w${dia}-${i}`,
              choice: 0,
              correct: true,
              points: 10,
            },
          });
        }
      }
      expect(atual.inicio).toBeTruthy();
      const p = JSON.parse((await get('progress')).body);
      expect(p.weeksInARow).toBe(2);
    });
  });

  describe('Isolamento entre igrejas', () => {
    it('a temporada e a votação de B são dela, não de A', async () => {
      await get('season');
      const B = await criarIgreja(app, 'Igreja B');
      await get('season', B.memberToken);
      const temporadas = await prismaOf(app).arenaSeason.findMany();
      expect(temporadas).toHaveLength(2);
      expect(new Set(temporadas.map((t) => t.churchId)).size).toBe(2);
    });

    it('membro do portal não mexe no painel da Arena', async () => {
      const res = await req(app, 'GET', '/v1/arena/overview', A.memberToken);
      expect(res.statusCode).toBe(401);
    });
  });
});
