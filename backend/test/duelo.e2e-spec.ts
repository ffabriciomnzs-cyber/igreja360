import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp, criarIgreja, prismaOf, resetDb, req, IgrejaFixture,
} from './helpers';
import { QUESTIONS } from '../src/arena/questions';
import { PushService } from '../src/push/push.service';

/**
 * Duelo 1x1: convite, aceite, revanche e resultado.
 *
 * Os dois bugs relatados em produção viraram teste: o empate que elegia um
 * vencedor por tempo (e mostrava resultados diferentes para cada lado) e a
 * revanche que nascia muda, sem ninguém para aceitá-la.
 */
describe('Duelo 1x1', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;
  let tokenB: string;
  let idB: string;
  let avisos: { memberId: string; title: string }[];

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prismaOf(app));
    A = await criarIgreja(app, 'Igreja A');
    const bcrypt = await import('bcryptjs');
    const membro = await prismaOf(app).member.create({
      data: {
        churchId: A.churchId,
        name: 'Thaís Moreira',
        email: 'thais@teste.local',
        passwordHash: await bcrypt.hash('Senha@12345', 4),
        portalStatus: 'APPROVED',
        status: 'ACTIVE',
      },
    });
    idB = membro.id;
    const login = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug, email: 'thais@teste.local', password: 'Senha@12345',
    });
    tokenB = JSON.parse(login.body).accessToken;

    avisos = [];
    jest
      .spyOn(app.get(PushService), 'notifyMember')
      .mockImplementation(async (memberId, p) => {
        avisos.push({ memberId, title: p.title });
      });
  });

  const get = (r: string, t = A.memberToken) =>
    req(app, 'GET', `/v1/member-auth/arena/${r}`, t);
  const post = (r: string, body: unknown = {}, t = A.memberToken) =>
    req(app, 'POST', `/v1/member-auth/arena/${r}`, t, body);

  /** Duelo por link já aceito: B abre o convite e entra. */
  async function duelo() {
    const criado = JSON.parse((await post('duels')).body);
    await get(`duels/token/${criado.token}`, tokenB);
    return criado as { id: string; token: string };
  }

  /** Joga a rodada de um lado. `acertos` = quantas responder certo. */
  async function joga(token: string, acertos: number) {
    for (let n = 0; ; n++) {
      const e = JSON.parse((await get(`duels/token/${jogoAtual}`, token)).body);
      if (!e.current) return e;
      const q = e.current;
      await post(`duels/${e.id}/open`, { questionId: q.id }, token);
      const orig = QUESTIONS.find((x) => x.id === q.id)!;
      const certa = q.options.indexOf(orig.options[orig.answer]);
      await post(
        `duels/${e.id}/answer`,
        { questionId: q.id, choice: n < acertos ? certa : (certa + 1) % 4 },
        token,
      );
    }
  }
  let jogoAtual = '';

  describe('BUG 1 — empate', () => {
    it('mesma pontuação é EMPATE e os dois veem a MESMA coisa', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 1);
      const fimB = await joga(tokenB, 1);
      const fimA = JSON.parse((await get(`duels/token/${d.token}`)).body);

      expect(fimA.winner).toBe('draw');
      expect(fimB.winner).toBe('draw');
      expect(fimA.status).toBe('COMPLETED');
      // O placar é o mesmo dos dois lados, só trocando de lugar.
      expect(fimA.challenger.score).toBe(fimB.challenger.score);
      expect(fimA.opponent.score).toBe(fimB.opponent.score);
      expect(fimA.challenger.score).toBe(fimA.opponent.score);
    });

    it('empate NÃO conta vitória para ninguém no histórico', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 1);
      const fim = await joga(tokenB, 1);
      expect(fim.history).toEqual({ aWins: 0, bWins: 0, draws: 1 });
    });

    it('quem acerta mais vence, independente do tempo', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      // A demora (turnos envelhecidos) mas acerta mais: tem que vencer.
      await joga(A.memberToken, 4);
      await prismaOf(app).arenaRoundTurn.updateMany({
        where: { duelId: d.id, memberId: A.memberId },
        data: { openedAt: new Date(Date.now() - 19_000) },
      });
      const fim = await joga(tokenB, 2);
      expect(fim.winner).toBe('challenger');
      expect(fim.history).toEqual({ aWins: 1, bWins: 0, draws: 0 });
    });
  });

  describe('BUG 2 — revanche', () => {
    async function duelaEFecha() {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 3);
      await joga(tokenB, 1);
      return d;
    }

    it('revanche cria NOVO duelo, esperando aceite, com perguntas novas', async () => {
      const d = await duelaEFecha();
      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      expect(r.token).not.toBe(d.token);

      const estado = JSON.parse((await get(`duels/token/${r.token}`)).body);
      expect(estado.status).toBe('INVITED');
      expect(estado.isRematch).toBe(true);
      expect(estado.current).toBeNull(); // ninguém joga antes do aceite

      const [velho, novo] = await Promise.all([
        prismaOf(app).arenaDuel.findUnique({ where: { id: d.id } }),
        prismaOf(app).arenaDuel.findUnique({ where: { id: r.id } }),
      ]);
      expect(novo!.rematchOfId).toBe(d.id);
      expect(novo!.questionIds).not.toEqual(velho!.questionIds);
      // O duelo anterior não pode ser tocado pela revanche.
      expect(velho!.acceptedAt).toEqual(velho!.acceptedAt);
      expect(await prismaOf(app).arenaRoundTurn.count({ where: { duelId: r.id } })).toBe(0);
    });

    it('só o convidado decide, e responder antes do aceite é recusado', async () => {
      const d = await duelaEFecha();
      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);

      // Quem pediu não pode aceitar por si mesmo.
      expect((await post(`duels/${r.id}/accept`)).statusCode).toBe(400);
      const estado = JSON.parse((await get(`duels/token/${r.token}`, tokenB)).body);
      expect(estado.canDecide).toBe(true);

      const primeira = (await prismaOf(app).arenaDuel.findUnique({ where: { id: r.id } }))!
        .questionIds[0];
      expect(
        (await post(`duels/${r.id}/open`, { questionId: primeira }, tokenB)).statusCode,
      ).toBe(400);
    });

    it('aceitar é idempotente e libera a partida', async () => {
      const d = await duelaEFecha();
      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      const um = JSON.parse((await post(`duels/${r.id}/accept`, {}, tokenB)).body);
      const dois = JSON.parse((await post(`duels/${r.id}/accept`, {}, tokenB)).body);
      expect(um.status).toBe('ACTIVE');
      expect(dois.status).toBe('ACTIVE');
      const linha = await prismaOf(app).arenaDuel.findUnique({ where: { id: r.id } });
      expect(linha!.acceptedAt).toBeTruthy();
    });

    it('recusar encerra o convite e some da Arena', async () => {
      const d = await duelaEFecha();
      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      expect((await post(`duels/${r.id}/decline`, {}, tokenB)).statusCode).toBe(200);
      expect(JSON.parse((await get(`duels/token/${r.token}`)).body).status).toBe('DECLINED');
      const lista = JSON.parse((await get('duels', tokenB)).body);
      expect(lista.received).toHaveLength(0);
    });

    it('quem termina primeiro fica AGUARDANDO; com os dois, sai o resultado', async () => {
      const d = await duelaEFecha();
      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      await post(`duels/${r.id}/accept`, {}, tokenB);
      jogoAtual = r.token;

      const meio = await joga(A.memberToken, 5);
      expect(meio.status).toBe('WAITING_OPPONENT');
      expect(meio.opponent.score).toBeNull(); // o outro ainda não terminou

      const fim = await joga(tokenB, 2);
      expect(fim.status).toBe('COMPLETED');
      expect(fim.winner).toBe('challenger');
      // Segunda vitória de A: o histórico junta as duas partidas.
      expect(fim.history).toEqual({ aWins: 2, bWins: 0, draws: 0 });
    });

    it('revanche pode terminar em derrota e em empate', async () => {
      const d = await duelaEFecha();
      const r1 = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      await post(`duels/${r1.id}/accept`, {}, tokenB);
      jogoAtual = r1.token;
      await joga(A.memberToken, 1);
      expect((await joga(tokenB, 4)).winner).toBe('opponent');

      const r2 = JSON.parse((await post('duels', { rematchOf: r1.id })).body);
      await post(`duels/${r2.id}/accept`, {}, tokenB);
      jogoAtual = r2.token;
      await joga(A.memberToken, 2);
      const empate = await joga(tokenB, 2);
      expect(empate.winner).toBe('draw');
      expect(empate.history).toEqual({ aWins: 1, bWins: 1, draws: 1 });
    });
  });

  describe('Convites e push', () => {
    it('o convite de revanche gera UM push, nominal, e não repete', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 2);
      await joga(tokenB, 1);
      avisos.length = 0;

      const r = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      await new Promise((x) => setTimeout(x, 120));
      const convites = avisos.filter((a) => a.title.includes('revanche'));
      expect(convites).toHaveLength(1);
      expect(convites[0].memberId).toBe(idB);
      expect(convites[0].title).toContain('Membro'); // quem desafiou

      // Pedir de novo devolve a MESMA revanche e não avisa outra vez.
      const denovo = JSON.parse((await post('duels', { rematchOf: d.id })).body);
      await new Promise((x) => setTimeout(x, 120));
      expect(denovo.token).toBe(r.token);
      expect(avisos.filter((a) => a.title.includes('revanche'))).toHaveLength(1);
    });

    it('o resultado avisa os DOIS, uma vez só', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 3);
      avisos.length = 0;
      await joga(tokenB, 1);
      await new Promise((x) => setTimeout(x, 150));

      const finais = avisos.filter((a) => /venceu|Empate/.test(a.title));
      expect(finais).toHaveLength(2);
      expect(new Set(finais.map((f) => f.memberId))).toEqual(new Set([A.memberId, idB]));
    });

    it('a Arena separa recebidos, enviados e em andamento', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 2);
      await joga(tokenB, 2);
      await post('duels', { rematchOf: d.id }); // convite nominal para B
      await post('duels'); // convite por link, sem dono

      const deA = JSON.parse((await get('duels')).body);
      const deB = JSON.parse((await get('duels', tokenB)).body);
      expect(deA.sent.length).toBeGreaterThanOrEqual(1);
      expect(deA.received).toHaveLength(0);
      expect(deB.received).toHaveLength(1);
      expect(deB.received[0].isRematch).toBe(true);
    });
  });

  describe('Integridade', () => {
    it('duelo encerrado não aceita mais respostas', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 5);
      await joga(tokenB, 5);
      const linha = await prismaOf(app).arenaDuel.findUnique({ where: { id: d.id } });
      const res = await post(`duels/${d.id}/open`, { questionId: linha!.questionIds[0] });
      expect(res.statusCode).toBe(409);
    });

    it('membro não responde pelo outro nem espia duelo alheio', async () => {
      const d = await duelo();
      const C = await criarIgreja(app, 'Igreja B');
      expect((await get(`duels/token/${d.token}`, C.memberToken)).statusCode).toBe(404);
    });

    it('duas finalizações simultâneas não duplicam o resultado', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 3);
      await joga(tokenB, 1);
      avisos.length = 0;
      // Duas leituras concorrentes do estado final: nada de aviso novo.
      await Promise.all([
        get(`duels/token/${d.token}`),
        get(`duels/token/${d.token}`, tokenB),
      ]);
      await new Promise((x) => setTimeout(x, 120));
      expect(avisos.filter((a) => /venceu|Empate/.test(a.title))).toHaveLength(0);
    });

    it('o duelo NÃO entra no ranking semanal', async () => {
      const d = await duelo();
      jogoAtual = d.token;
      await joga(A.memberToken, 5);
      await joga(tokenB, 5);
      expect(await prismaOf(app).arenaAnswer.count()).toBe(0);
      expect(JSON.parse((await get('ranking?period=all')).body).me.points).toBe(0);
    });
  });
});
