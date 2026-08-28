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
 * Equipes e escala de voluntários.
 *
 * O que não pode falhar: ninguém escalado duas vezes no mesmo culto, o
 * voluntário só respondendo pela PRÓPRIA escala, e a escala de uma igreja
 * nunca aparecendo na outra.
 */
describe('Escalas de voluntários', () => {
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

  const domingo = new Date(Date.now() + 3 * 86_400_000).toISOString();

  async function criaEquipe(nome = 'Louvor', token = A.adminToken) {
    const res = await req(app, 'POST', '/v1/teams', token, { name: nome });
    const lista = JSON.parse(res.body);
    return lista.find((e: { name: string }) => e.name === nome);
  }

  const escalar = (
    teamId: string,
    memberId: string,
    date = domingo,
    token = A.adminToken,
    role?: string,
  ) => req(app, 'POST', '/v1/schedule', token, { teamId, memberId, date, role });

  describe('Equipes', () => {
    it('cria equipe e adiciona quem serve, com a função', async () => {
      const equipe = await criaEquipe('Louvor');
      expect(equipe.name).toBe('Louvor');

      const res = await req(
        app,
        'POST',
        `/v1/teams/${equipe.id}/members`,
        A.adminToken,
        { memberId: A.memberId, role: 'Vocal' },
      );
      expect(res.statusCode).toBe(200);
      const atualizado = JSON.parse(res.body).find(
        (e: { id: string }) => e.id === equipe.id,
      );
      expect(atualizado.members).toHaveLength(1);
      expect(atualizado.members[0].role).toBe('Vocal');
    });

    it('adicionar duas vezes não duplica — só atualiza a função', async () => {
      const equipe = await criaEquipe();
      await req(app, 'POST', `/v1/teams/${equipe.id}/members`, A.adminToken, {
        memberId: A.memberId,
        role: 'Vocal',
      });
      const res = await req(
        app,
        'POST',
        `/v1/teams/${equipe.id}/members`,
        A.adminToken,
        { memberId: A.memberId, role: 'Guitarra' },
      );
      const atualizado = JSON.parse(res.body).find(
        (e: { id: string }) => e.id === equipe.id,
      );
      expect(atualizado.members).toHaveLength(1);
      expect(atualizado.members[0].role).toBe('Guitarra');
    });

    it('não adiciona membro de outra igreja na equipe', async () => {
      const equipe = await criaEquipe();
      const B = await criarIgreja(app, 'Igreja B');
      const res = await req(
        app,
        'POST',
        `/v1/teams/${equipe.id}/members`,
        A.adminToken,
        { memberId: B.memberId },
      );
      expect(res.statusCode).toBe(404);
      expect(await prismaOf(app).teamMember.count()).toBe(0);
    });
  });

  describe('Escalar', () => {
    it('escala e a pessoa aparece como pendente', async () => {
      const equipe = await criaEquipe();
      const res = await escalar(equipe.id, A.memberId, domingo, A.adminToken, 'Vocal');
      expect(res.statusCode).toBe(201);

      const escala = JSON.parse(res.body);
      expect(escala).toHaveLength(1);
      expect(escala[0].status).toBe('PENDING');
      expect(escala[0].teamName).toBe('Louvor');
      expect(escala[0].role).toBe('Vocal');
    });

    it('escalar a mesma pessoa duas vezes no mesmo dia não duplica', async () => {
      const equipe = await criaEquipe();
      await escalar(equipe.id, A.memberId);
      await escalar(equipe.id, A.memberId);
      expect(await prismaOf(app).scheduleSlot.count()).toBe(1);
    });

    it('remover a equipe leva as escalas dela junto', async () => {
      const equipe = await criaEquipe();
      await escalar(equipe.id, A.memberId);
      expect(await prismaOf(app).scheduleSlot.count()).toBe(1);

      await req(app, 'DELETE', `/v1/teams/${equipe.id}`, A.adminToken);
      expect(await prismaOf(app).scheduleSlot.count()).toBe(0);
    });
  });

  describe('O voluntário responde', () => {
    it('vê a própria escala e confirma', async () => {
      const equipe = await criaEquipe();
      await escalar(equipe.id, A.memberId, domingo, A.adminToken, 'Vocal');

      const minha = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/schedule', A.memberToken)).body,
      );
      expect(minha).toHaveLength(1);
      expect(minha[0].status).toBe('PENDING');

      const res = await req(
        app,
        'POST',
        `/v1/member-auth/schedule/${minha[0].id}/respond`,
        A.memberToken,
        { confirm: true },
      );
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)[0].status).toBe('CONFIRMED');
    });

    it('avisa que não pode, e o painel enxerga', async () => {
      const equipe = await criaEquipe();
      await escalar(equipe.id, A.memberId);
      const minha = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/schedule', A.memberToken)).body,
      );
      await req(
        app,
        'POST',
        `/v1/member-auth/schedule/${minha[0].id}/respond`,
        A.memberToken,
        { confirm: false },
      );

      const escala = JSON.parse(
        (await req(app, 'GET', '/v1/schedule', A.adminToken)).body,
      );
      expect(escala[0].status).toBe('DECLINED');
    });

    it('NÃO responde pela escala de outra pessoa', async () => {
      const equipe = await criaEquipe();
      const outro = await prismaOf(app).member.create({
        data: {
          churchId: A.churchId,
          name: 'Outro Voluntário',
          status: 'ACTIVE',
          portalStatus: 'APPROVED',
        },
      });
      await escalar(equipe.id, outro.id);
      const slot = await prismaOf(app).scheduleSlot.findFirst();

      const res = await req(
        app,
        'POST',
        `/v1/member-auth/schedule/${slot!.id}/respond`,
        A.memberToken,
        { confirm: false },
      );
      expect(res.statusCode).toBe(404);
      const depois = await prismaOf(app).scheduleSlot.findFirst();
      expect(depois!.status).toBe('PENDING');
    });

    it('escala passada não polui a lista do voluntário', async () => {
      const equipe = await criaEquipe();
      const semanaPassada = new Date(Date.now() - 7 * 86_400_000).toISOString();
      await escalar(equipe.id, A.memberId, semanaPassada);
      const minha = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/schedule', A.memberToken)).body,
      );
      expect(minha).toHaveLength(0);
    });
  });

  describe('Isolamento entre igrejas', () => {
    it('a escala da igreja A não aparece na B', async () => {
      const equipe = await criaEquipe();
      await escalar(equipe.id, A.memberId);
      const B = await criarIgreja(app, 'Igreja B');

      expect(
        JSON.parse((await req(app, 'GET', '/v1/schedule', B.adminToken)).body),
      ).toHaveLength(0);
      expect(
        JSON.parse((await req(app, 'GET', '/v1/teams', B.adminToken)).body),
      ).toHaveLength(0);

      // E a B não consegue escalar ninguém na equipe da A.
      const res = await escalar(equipe.id, B.memberId, domingo, B.adminToken);
      expect(res.statusCode).toBe(404);
    });

    it('membro do portal não monta escala', async () => {
      expect((await req(app, 'GET', '/v1/teams', A.memberToken)).statusCode).toBe(401);
      expect((await req(app, 'POST', '/v1/schedule', A.memberToken, {})).statusCode).toBe(401);
    });
  });
});
