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
 * Contas parceladas. Aqui mexe em DINHEIRO: a regra é que cadastrar a conta
 * NÃO altera o saldo, e cada parcela vira despesa só quando paga. Um erro
 * aqui some com dinheiro do caixa da igreja ou conta a mesma compra duas vezes.
 */
describe('Contas parceladas', () => {
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

  function criar(token: string, extra: Record<string, unknown> = {}) {
    return req(app, 'POST', '/v1/payables', token, {
      description: 'Ar-condicionado do templo',
      creditor: 'Friocenter',
      category: 'Manutenção',
      installments: 10,
      amount: 350,
      firstDueDate: '2026-07-05',
      ...extra,
    });
  }

  const saldo = async (token: string) =>
    JSON.parse((await req(app, 'GET', '/v1/financial/stats', token)).body);

  describe('Cadastro', () => {
    it('gera as parcelas com as datas certas e NÃO mexe no saldo', async () => {
      const antes = await saldo(A.adminToken);

      const res = await criar(A.adminToken);
      expect(res.statusCode).toBe(201);
      const conta = JSON.parse(res.body);

      expect(conta.items).toHaveLength(10);
      expect(conta.items[0].dueDate.slice(0, 10)).toBe('2026-07-05');
      expect(conta.items[1].dueDate.slice(0, 10)).toBe('2026-08-05');
      expect(conta.items[9].dueDate.slice(0, 10)).toBe('2027-04-05');
      expect(conta.totalAmount).toBe(3500);
      expect(conta.paidCount).toBe(0);

      // O caixa não pode ter sentido nada.
      const depois = await saldo(A.adminToken);
      expect(depois.balance).toBe(antes.balance);
      expect(depois.expense).toBe(antes.expense);
    });

    it('encaixa o vencimento em meses mais curtos (31 → último dia)', async () => {
      const res = await criar(A.adminToken, {
        installments: 3,
        firstDueDate: '2026-01-31',
      });
      const conta = JSON.parse(res.body);
      expect(conta.items[0].dueDate.slice(0, 10)).toBe('2026-01-31');
      expect(conta.items[1].dueDate.slice(0, 10)).toBe('2026-02-28');
      expect(conta.items[2].dueDate.slice(0, 10)).toBe('2026-03-31');
    });

    it('recusa conta com menos de 2 parcelas ou valor zero', async () => {
      expect((await criar(A.adminToken, { installments: 1 })).statusCode).toBe(400);
      expect((await criar(A.adminToken, { amount: 0 })).statusCode).toBe(400);
    });
  });

  describe('Pagamento', () => {
    it('pagar lança a despesa no caixa, uma única vez', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      const parcela = conta.items[0];

      const res = await req(
        app,
        'POST',
        `/v1/payables/installments/${parcela.id}/pay`,
        A.adminToken,
        {},
      );
      expect(res.statusCode).toBe(200);
      const atualizada = JSON.parse(res.body);
      expect(atualizada.paidCount).toBe(1);
      expect(atualizada.openAmount).toBe(3150); // 9 × 350

      const depois = await saldo(A.adminToken);
      expect(depois.expense).toBe(350);
      expect(depois.balance).toBe(-350);

      // A despesa aparece no extrato, com a categoria da conta.
      const extrato = JSON.parse(
        (await req(app, 'GET', '/v1/financial', A.adminToken)).body,
      );
      const lancamentos = extrato.data ?? extrato;
      expect(lancamentos).toHaveLength(1);
      expect(lancamentos[0].category).toBe('Manutenção');
      expect(lancamentos[0].description).toContain('parcela 1/10');

      // Pagar de novo não pode duplicar a despesa.
      const outra = await req(
        app,
        'POST',
        `/v1/payables/installments/${parcela.id}/pay`,
        A.adminToken,
        {},
      );
      expect(outra.statusCode).toBe(400);
      expect((await saldo(A.adminToken)).expense).toBe(350);
    });

    it('aceita valor diferente da parcela (juros ou desconto)', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      await req(
        app,
        'POST',
        `/v1/payables/installments/${conta.items[0].id}/pay`,
        A.adminToken,
        { amount: 372.5 },
      );
      expect((await saldo(A.adminToken)).expense).toBe(372.5);
    });

    it('desfazer o pagamento apaga a despesa e reabre a parcela', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      const parcela = conta.items[0];
      await req(
        app,
        'POST',
        `/v1/payables/installments/${parcela.id}/pay`,
        A.adminToken,
        {},
      );
      const res = await req(
        app,
        'POST',
        `/v1/payables/installments/${parcela.id}/unpay`,
        A.adminToken,
      );
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).paidCount).toBe(0);

      const depois = await saldo(A.adminToken);
      expect(depois.expense).toBe(0);
      expect(depois.balance).toBe(0);

      const extrato = JSON.parse(
        (await req(app, 'GET', '/v1/financial', A.adminToken)).body,
      );
      expect((extrato.data ?? extrato).length).toBe(0);
    });
  });

  describe('Exclusão', () => {
    it('recusa apagar conta com parcela paga (sumiria com despesa real)', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      await req(
        app,
        'POST',
        `/v1/payables/installments/${conta.items[0].id}/pay`,
        A.adminToken,
        {},
      );
      const res = await req(app, 'DELETE', `/v1/payables/${conta.id}`, A.adminToken);
      expect(res.statusCode).toBe(400);
      // A despesa continua lá.
      expect((await saldo(A.adminToken)).expense).toBe(350);
    });

    it('apaga a conta quando nada foi pago', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      const res = await req(app, 'DELETE', `/v1/payables/${conta.id}`, A.adminToken);
      expect(res.statusCode).toBe(200);
      expect(
        JSON.parse((await req(app, 'GET', '/v1/payables', A.adminToken)).body),
      ).toHaveLength(0);
    });
  });

  describe('Isolamento e permissão', () => {
    it('não enxerga nem paga conta de OUTRA igreja', async () => {
      const conta = JSON.parse((await criar(A.adminToken)).body);
      const B = await criarIgreja(app, 'Igreja B');

      const lista = JSON.parse(
        (await req(app, 'GET', '/v1/payables', B.adminToken)).body,
      );
      expect(lista).toHaveLength(0);

      expect(
        (await req(app, 'GET', `/v1/payables/${conta.id}`, B.adminToken)).statusCode,
      ).toBe(404);
      expect(
        (
          await req(
            app,
            'POST',
            `/v1/payables/installments/${conta.items[0].id}/pay`,
            B.adminToken,
            {},
          )
        ).statusCode,
      ).toBe(404);
      // E o caixa da igreja A segue intacto.
      expect((await saldo(A.adminToken)).expense).toBe(0);
    });

    it('membro do portal não acessa contas do painel', async () => {
      const res = await req(app, 'GET', '/v1/payables', A.memberToken);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Resumo do topo', () => {
    it('soma o que falta, o que vence no mês e o que está atrasado', async () => {
      const prisma = prismaOf(app);
      const conta = JSON.parse((await criar(A.adminToken)).body);

      // Joga a 1ª parcela para ontem (atrasada) e a 2ª para hoje.
      const ontem = new Date(Date.now() - 86_400_000);
      const hoje = new Date();
      await prisma.payableInstallment.update({
        where: { id: conta.items[0].id },
        data: { dueDate: ontem },
      });
      await prisma.payableInstallment.update({
        where: { id: conta.items[1].id },
        data: { dueDate: hoje },
      });

      const stats = JSON.parse(
        (await req(app, 'GET', '/v1/payables/stats', A.adminToken)).body,
      );
      expect(stats.openAmount).toBe(3500);
      expect(stats.overdueCount).toBe(1);
      expect(stats.overdueAmount).toBe(350);
      expect(stats.monthCount).toBeGreaterThanOrEqual(2);
    });
  });
});
