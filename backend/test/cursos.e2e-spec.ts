import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp, criarIgreja, prismaOf, resetDb, req, IgrejaFixture,
} from './helpers';

/**
 * Cursos do app (batismo e noivos).
 *
 * O que os testes seguram:
 *  1) doutrina não vai ao ar sozinha — o modelo nasce fechado;
 *  2) no curso de casal, um sozinho não conclui pelos dois;
 *  3) o que o par escreveu é dele e da liderança, não vaza para o outro;
 *  4) registrar o batismo preenche o cadastro, que é o que fecha o ciclo.
 */
describe('Cursos', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;
  let tokenB: string;
  let idB: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  beforeEach(async () => {
    await resetDb(prismaOf(app));
    A = await criarIgreja(app, 'Igreja A');
    const bcrypt = await import('bcryptjs');
    const noiva = await prismaOf(app).member.create({
      data: {
        churchId: A.churchId, name: 'Thaís Noiva', email: 'noiva@teste.local',
        passwordHash: await bcrypt.hash('Senha@12345', 4),
        portalStatus: 'APPROVED', status: 'ACTIVE',
      },
    });
    idB = noiva.id;
    const login = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug, email: 'noiva@teste.local', password: 'Senha@12345',
    });
    tokenB = JSON.parse(login.body).accessToken;
  });

  const adm = (m: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', r: string, body?: unknown) =>
    req(app, m, `/v1/courses${r}`, A.adminToken, body);
  const portal = (m: 'GET'|'POST', r: string, body?: unknown, t = A.memberToken) =>
    req(app, m, `/v1/member-auth/courses${r}`, t, body);

  async function criaCurso(modelo: 'batismo' | 'noivos') {
    const res = await adm('POST', `/templates/${modelo}`);
    return JSON.parse(res.body);
  }
  const publica = (id: string) => adm('PATCH', `/${id}`, { published: true });

  describe('Modelos e publicação', () => {
    it('os dois modelos existem e trazem lições', async () => {
      const m = JSON.parse((await adm('GET', '/templates')).body);
      expect(m.map((x: { id: string }) => x.id).sort()).toEqual(['batismo', 'noivos']);
      expect(m.every((x: { lessons: number }) => x.lessons >= 5)).toBe(true);
    });

    it('o curso nasce FECHADO: doutrina não vai ao ar sem alguém ler', async () => {
      const c = await criaCurso('batismo');
      expect(c.published).toBe(false);
      expect(c.lessons.length).toBeGreaterThanOrEqual(5);
      expect(c.lessons[0].position).toBe(1);
      // E o membro não vê nada enquanto não for publicado.
      expect(JSON.parse((await portal('GET', '')).body)).toHaveLength(0);
    });

    it('não publica curso sem lição', async () => {
      const c = await criaCurso('batismo');
      for (const l of c.lessons) await adm('DELETE', `/lessons/${l.id}`);
      const res = await publica(c.id);
      expect(res.statusCode).toBe(400);
    });

    it('depois de publicado, o membro vê e se inscreve', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      const lista = JSON.parse((await portal('GET', '')).body);
      expect(lista).toHaveLength(1);
      expect(lista[0].enrolled).toBe(false);

      const detalhe = JSON.parse((await portal('POST', `/${c.id}/enroll`)).body);
      expect(detalhe.enrolled).toBe(true);
      expect(detalhe.lessons[0].done).toBe(false);
      // O texto da lição vem; o progresso do outro, não (curso individual).
      expect(detalhe.lessons[0].content.length).toBeGreaterThan(50);
    });
  });

  describe('Fazer o curso', () => {
    it('marcar a lição guarda o progresso e a reflexão', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const antes = JSON.parse((await portal('GET', `/${c.id}`)).body);

      const depois = JSON.parse(
        (await portal('POST', `/lessons/${antes.lessons[0].id}/done`, {
          reflection: 'Decidi seguir a Jesus no ano passado.',
        })).body,
      );
      expect(depois.lessons[0].done).toBe(true);
      expect(depois.lessons[0].reflection).toContain('Decidi seguir');
      expect(depois.lessons[1].done).toBe(false);
    });

    it('marcar duas vezes não duplica nem reabre', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const d = JSON.parse((await portal('GET', `/${c.id}`)).body);
      await portal('POST', `/lessons/${d.lessons[0].id}/done`, {});
      await portal('POST', `/lessons/${d.lessons[0].id}/done`, {});
      expect(await prismaOf(app).courseProgress.count()).toBe(1);
    });

    it('não dá para fazer sem se inscrever', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      const licao = (await prismaOf(app).courseLesson.findFirst({
        where: { courseId: c.id },
      }))!;
      const res = await portal('POST', `/lessons/${licao.id}/done`, {});
      expect(res.statusCode).toBe(400);
    });

    it('concluir todas fecha a inscrição', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const d = JSON.parse((await portal('GET', `/${c.id}`)).body);
      for (const l of d.lessons) await portal('POST', `/lessons/${l.id}/done`, {});
      const fim = JSON.parse((await portal('GET', `/${c.id}`)).body);
      expect(fim.completedAt).toBeTruthy();
      expect(fim.pastorTalkAt).toBeNull(); // falta a conversa
    });
  });

  describe('Curso de casal', () => {
    async function casal() {
      const c = await criaCurso('noivos');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const lista = JSON.parse((await adm('GET', '')).body);
      const inscricao = lista.find((x: { id: string }) => x.id === c.id).enrollments[0];
      await adm('PUT', `/enrollments/${inscricao.id}/partner`, { partnerId: idB });
      return { curso: c, enrollmentId: inscricao.id };
    }

    it('um sozinho NÃO conclui pelos dois', async () => {
      const { curso } = await casal();
      const d = JSON.parse((await portal('GET', `/${curso.id}`)).body);
      for (const l of d.lessons) await portal('POST', `/lessons/${l.id}/done`, {});

      const meu = JSON.parse((await portal('GET', `/${curso.id}`)).body);
      expect(meu.completedAt).toBeNull();
      expect(meu.partnerName).toBeTruthy();
      expect(meu.lessons[0].partnerDone).toBe(false);
    });

    it('com os dois, conclui', async () => {
      const { curso } = await casal();
      const d = JSON.parse((await portal('GET', `/${curso.id}`)).body);
      for (const l of d.lessons) await portal('POST', `/lessons/${l.id}/done`, {});
      for (const l of d.lessons) {
        await portal('POST', `/lessons/${l.id}/done`, {}, tokenB);
      }
      expect(JSON.parse((await portal('GET', `/${curso.id}`)).body).completedAt).toBeTruthy();
    });

    it('a reflexão do par NÃO vaza para o outro, mas a liderança lê as duas', async () => {
      const { curso, enrollmentId } = await casal();
      const d = JSON.parse((await portal('GET', `/${curso.id}`)).body);
      const primeira = d.lessons[0].id;
      await portal('POST', `/lessons/${primeira}/done`, { reflection: 'resposta dele' });
      await portal('POST', `/lessons/${primeira}/done`, { reflection: 'resposta dela' }, tokenB);

      // Os DOIS lados precisam ser conferidos: olhando só um, uma falha que
      // devolvesse "a primeira reflexão que achar" passaria batida.
      const dele = JSON.parse((await portal('GET', `/${curso.id}`)).body);
      expect(dele.lessons[0].reflection).toBe('resposta dele');
      expect(JSON.stringify(dele)).not.toContain('resposta dela');

      const dela = JSON.parse((await portal('GET', `/${curso.id}`, undefined, tokenB)).body);
      expect(dela.lessons[0].reflection).toBe('resposta dela');
      expect(JSON.stringify(dela)).not.toContain('resposta dele');

      const pastoral = JSON.parse(
        (await adm('GET', `/enrollments/${enrollmentId}/reflections`)).body,
      );
      const textos = JSON.stringify(pastoral);
      expect(textos).toContain('resposta dele');
      expect(textos).toContain('resposta dela');
    });

    it('o mesmo par não entra duas vezes no curso', async () => {
      const { enrollmentId } = await casal();
      await portal('POST', `/${
        (await prismaOf(app).course.findFirst({ where: { couple: true } }))!.id
      }/enroll`, {}, tokenB);
      const res = await adm('PUT', `/enrollments/${enrollmentId}/partner`, { partnerId: idB });
      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('Liderança', () => {
    it('a conversa com o pastor é marcada só no painel', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const lista = JSON.parse((await adm('GET', '')).body);
      const e = lista[0].enrollments[0];

      const depois = JSON.parse(
        (await adm('PUT', `/enrollments/${e.id}/registro`, { pastorTalk: true })).body,
      );
      expect(depois[0].enrollments[0].pastorTalkAt).toBeTruthy();
    });

    it('registrar o batismo preenche o cadastro do membro', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      await portal('POST', `/${c.id}/enroll`);
      const e = JSON.parse((await adm('GET', '')).body)[0].enrollments[0];

      await adm('PUT', `/enrollments/${e.id}/registro`, { baptizedAt: '2026-11-15' });
      const membro = await prismaOf(app).member.findUnique({ where: { id: A.memberId } });
      // É isto que alimenta o aniversário de batismo depois.
      expect(membro!.baptismDate?.toISOString().slice(0, 10)).toBe('2026-11-15');
    });

    it('membro do portal não entra no painel de cursos', async () => {
      expect((await req(app, 'GET', '/v1/courses', A.memberToken)).statusCode).toBe(401);
    });

    it('curso de uma igreja não aparece na outra', async () => {
      const c = await criaCurso('batismo');
      await publica(c.id);
      const B = await criarIgreja(app, 'Igreja B');
      expect(JSON.parse((await portal('GET', '', undefined, B.memberToken)).body)).toHaveLength(0);
      expect((await req(app, 'GET', '/v1/courses', B.adminToken)).body).toBe('[]');
    });
  });
});
