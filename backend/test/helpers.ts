import { ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sobe a aplicação com a MESMA configuração do main.ts (prefixo /v1, validação
 * com whitelist). Se o teste divergir do bootstrap real, ele deixa de provar
 * qualquer coisa sobre produção.
 */
export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

export function prismaOf(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

/** Apaga tudo entre os testes. Church em cascata leva o resto junto. */
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.pushSubscription.deleteMany({});
  await prisma.church.deleteMany({});
}

export interface IgrejaFixture {
  churchId: string;
  slug: string;
  /** Token de admin (painel). */
  adminToken: string;
  adminEmail: string;
  /** Membro aprovado no portal. */
  memberId: string;
  memberEmail: string;
  memberToken: string;
}

let contador = 0;

/**
 * Cria uma igreja completa e independente: admin logado + membro logado.
 * Cada chamada gera identificadores únicos, então duas igrejas nunca colidem
 * — é isso que permite testar o isolamento entre elas.
 */
export async function criarIgreja(
  app: NestFastifyApplication,
  nome: string,
): Promise<IgrejaFixture> {
  const prisma = prismaOf(app);
  const n = ++contador;
  const slug = `igreja-teste-${n}`;
  const adminEmail = `admin${n}@teste.local`;
  const memberEmail = `membro${n}@teste.local`;
  const senha = 'Senha@12345';
  const hash = await bcrypt.hash(senha, 4); // custo baixo: é só teste

  const church = await prisma.church.create({
    data: { name: nome, slug },
  });
  await prisma.user.create({
    data: {
      churchId: church.id,
      email: adminEmail,
      passwordHash: hash,
      name: `Admin ${nome}`,
      role: 'ADMIN',
      active: true,
    },
  });
  const member = await prisma.member.create({
    data: {
      churchId: church.id,
      name: `Membro ${nome}`,
      email: memberEmail,
      passwordHash: hash,
      portalStatus: 'APPROVED',
      status: 'ACTIVE',
    },
  });

  const adminToken = await login(app, '/v1/auth/login', {
    email: adminEmail,
    password: senha,
  });
  const memberToken = await login(app, '/v1/member-auth/login', {
    slug,
    email: memberEmail,
    password: senha,
  });

  return {
    churchId: church.id,
    slug,
    adminToken,
    adminEmail,
    memberId: member.id,
    memberEmail,
    memberToken,
  };
}

async function login(
  app: NestFastifyApplication,
  url: string,
  payload: Record<string, string>,
): Promise<string> {
  const res = await app.inject({ method: 'POST', url, payload });
  if (res.statusCode !== 200 && res.statusCode !== 201) {
    throw new Error(`Login falhou em ${url}: ${res.statusCode} ${res.body}`);
  }
  const token = JSON.parse(res.body).accessToken;
  if (!token) throw new Error(`Sem accessToken em ${url}: ${res.body}`);
  return token;
}

/** Atalho de requisição autenticada. */
export function req(
  app: NestFastifyApplication,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  token?: string,
  payload?: unknown,
) {
  return app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(payload !== undefined ? { payload: payload as object } : {}),
  });
}
