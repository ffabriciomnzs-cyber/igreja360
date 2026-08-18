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
 * Recados de aniversário. Envolve pessoas se falando: um erro aqui mostra o
 * recado para quem não devia, ou deixa a agenda telefônica da igreja vazar.
 */
describe('Aniversários no portal', () => {
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

  /** Data de nascimento que cai HOJE no fuso de Brasília. */
  function nascimentoHoje(ano = 1990): Date {
    const brt = new Date(Date.now() - 3 * 3600_000);
    return new Date(
      Date.UTC(ano, brt.getUTCMonth(), brt.getUTCDate(), 12, 0, 0),
    );
  }

  async function criaMembro(nome: string, nascimento: Date, phone?: string) {
    return prismaOf(app).member.create({
      data: {
        churchId: A.churchId,
        name: nome,
        birthDate: nascimento,
        phone,
        status: 'ACTIVE',
        portalStatus: 'APPROVED',
      },
    });
  }

  const lista = async (token = A.memberToken) =>
    JSON.parse((await req(app, 'GET', '/v1/member-auth/birthdays', token)).body);

  it('mostra quem faz aniversário hoje — e NUNCA o telefone na listagem', async () => {
    await criaMembro('Maria Silva', nascimentoHoje(), '(21) 99999-1111');
    const res = await lista();

    expect(res.today).toHaveLength(1);
    expect(res.today[0].name).toBe('Maria Silva');
    expect(res.today[0].greetings).toBe(0);
    expect(res.today[0].iGreeted).toBe(false);
    // A agenda telefônica não pode sair numa listagem.
    expect(JSON.stringify(res)).not.toContain('99999');
    expect(res.today[0].phone).toBeUndefined();
  });

  it('parabeniza uma vez: repetir edita o recado em vez de duplicar', async () => {
    const maria = await criaMembro('Maria Silva', nascimentoHoje());

    const p1 = await req(
      app,
      'POST',
      `/v1/member-auth/birthdays/${maria.id}/greet`,
      A.memberToken,
      { message: 'Parabéns!' },
    );
    expect(p1.statusCode).toBe(200);
    expect(JSON.parse(p1.body).greetings).toBe(1);

    const p2 = await req(
      app,
      'POST',
      `/v1/member-auth/birthdays/${maria.id}/greet`,
      A.memberToken,
      { message: 'Feliz aniversário, que Deus te abençoe!' },
    );
    expect(JSON.parse(p2.body).greetings).toBe(1); // continua 1

    const res = await lista();
    expect(res.today[0].greetings).toBe(1);
    expect(res.today[0].iGreeted).toBe(true);

    const recados = await prismaOf(app).birthdayGreeting.findMany();
    expect(recados).toHaveLength(1);
    expect(recados[0].message).toContain('que Deus te abençoe');
  });

  it('recusa parabenizar fora do dia do aniversário', async () => {
    const outroDia = new Date(Date.UTC(1990, 0, 1, 12));
    const joao = await criaMembro('João Fora de Data', outroDia);
    const res = await req(
      app,
      'POST',
      `/v1/member-auth/birthdays/${joao.id}/greet`,
      A.memberToken,
      { message: 'Parabéns!' },
    );
    expect(res.statusCode).toBe(400);
  });

  it('ninguém se parabeniza', async () => {
    await prismaOf(app).member.update({
      where: { id: A.memberId },
      data: { birthDate: nascimentoHoje() },
    });
    const res = await req(
      app,
      'POST',
      `/v1/member-auth/birthdays/${A.memberId}/greet`,
      A.memberToken,
    );
    expect(res.statusCode).toBe(400);
  });

  it('o aniversariante vê os recados que recebeu', async () => {
    // Hoje é aniversário do próprio membro logado.
    await prismaOf(app).member.update({
      where: { id: A.memberId },
      data: { birthDate: nascimentoHoje() },
    });
    const amiga = await criaMembro('Ana Clara', new Date(Date.UTC(1988, 5, 3, 12)));
    await prismaOf(app).birthdayGreeting.create({
      data: {
        churchId: A.churchId,
        memberId: A.memberId,
        authorId: amiga.id,
        year: new Date(Date.now() - 3 * 3600_000).getUTCFullYear(),
        message: 'Parabéns, querido!',
      },
    });

    const res = await lista();
    expect(res.mine.total).toBe(1);
    expect(res.mine.messages[0].authorName).toBe('Ana Clara');
    expect(res.mine.messages[0].message).toBe('Parabéns, querido!');
  });

  it('não enxerga nem parabeniza aniversariante de OUTRA igreja', async () => {
    const maria = await criaMembro('Maria Silva', nascimentoHoje());
    const B = await criarIgreja(app, 'Igreja B');

    const listaB = await lista(B.memberToken);
    expect(listaB.today).toHaveLength(0);

    const res = await req(
      app,
      'POST',
      `/v1/member-auth/birthdays/${maria.id}/greet`,
      B.memberToken,
      { message: 'oi' },
    );
    expect(res.statusCode).toBe(404);
    expect(await prismaOf(app).birthdayGreeting.count()).toBe(0);
  });

  describe('Link de WhatsApp (um número por vez)', () => {
    it('entrega o link só do aniversariante do dia', async () => {
      const maria = await criaMembro('Maria Silva', nascimentoHoje(), '(21) 99999-1111');
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/birthdays/${maria.id}/whatsapp`,
        A.memberToken,
      );
      expect(res.statusCode).toBe(200);
      const { url } = JSON.parse(res.body);
      expect(url).toContain('wa.me/5521999991111');
      expect(url).toContain('Feliz');
    });

    it('recusa fora do dia (não vira consulta de telefone)', async () => {
      const joao = await criaMembro(
        'João',
        new Date(Date.UTC(1990, 0, 1, 12)),
        '(21) 98888-2222',
      );
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/birthdays/${joao.id}/whatsapp`,
        A.memberToken,
      );
      expect(res.statusCode).toBe(400);
      expect(res.body).not.toContain('98888');
    });

    it('não entrega telefone de outra igreja', async () => {
      const maria = await criaMembro('Maria Silva', nascimentoHoje(), '(21) 99999-1111');
      const B = await criarIgreja(app, 'Igreja B');
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/birthdays/${maria.id}/whatsapp`,
        B.memberToken,
      );
      expect(res.statusCode).toBe(404);
      expect(res.body).not.toContain('99999');
    });
  });
});
