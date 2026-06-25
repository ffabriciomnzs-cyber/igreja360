# Igreja360

> Gestão clara. Igreja saudável.

Plataforma SaaS de gestão para igrejas. Monorepo com dois projetos:

- **`backend/`** — API NestJS (Fastify) + Prisma + PostgreSQL. Deploy na Railway.
- **`web/`** — Painel administrativo Next.js 14 (App Router) + Tailwind + shadcn-style UI. Deploy na Vercel.

Autenticação é **100% própria** (NestJS + bcrypt + JWT). **Não** usa Supabase para auth.

---

## Status desta entrega (Fase 1)

Implementado e verificado:

- Backend: schema Prisma completo (todos os módulos do brief), auth (login/refresh/me) com JWT + bcrypt, guards de role, seed com igreja e 4 usuários demo, Dockerfile e config de deploy Railway.
- Frontend: tela de login split-screen, layout do dashboard com sidebar e header, proteção de rota, dashboard com cards de métricas, e todas as rotas dos módulos navegáveis (placeholders por fase). Build de produção passando (`next build` ✓).
- Módulo futuro (rede social): pasta `backend/src/realtime/` preparada e **desabilitada** (ver seção própria abaixo).

As demais fases (Membros, Financeiro, Células, etc.) têm schema e navegação prontos; a lógica de cada módulo entra nas fases 2–5 do roadmap (seção 13 do brief).

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local ou Railway)
- Conta na Railway (backend) e na Vercel (frontend)

---

## Rodando localmente

### 1. Backend

```bash
cd backend
cp .env.example .env          # preencha DATABASE_URL e os segredos JWT
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

API em `http://localhost:3000/v1`. Teste: `GET http://localhost:3000/v1/health`.

### 2. Frontend

```bash
cd web
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3000/v1
npm install
npm run dev
```

Painel em `http://localhost:3000` (use outra porta se o backend já estiver na 3000, ex.: `npm run dev -- -p 3001`). A tela de login fica em `/auth`.

---

## Deploy — Backend (Railway)

1. Crie um projeto na Railway e adicione um banco **PostgreSQL** (plugin).
2. Crie um serviço a partir do repositório, apontando o root para `backend/`.
3. Variáveis de ambiente do serviço:

   ```
   DATABASE_URL=<a Railway injeta a URL do Postgres>
   JWT_SECRET=<segredo forte>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=<outro segredo forte>
   JWT_REFRESH_EXPIRES_IN=30d
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://<seu-frontend>.vercel.app
   ```

4. O build usa o `Dockerfile`. No deploy, o `startCommand` roda `prisma migrate deploy` e sobe a API.
5. Rode o seed uma vez (Railway shell ou localmente apontando `DATABASE_URL` para o banco de produção):

   ```bash
   cd backend && npm run seed
   ```

Gere segredos fortes com: `openssl rand -hex 32`.

## Deploy — Frontend (Vercel)

1. Importe o repositório na Vercel, com **Root Directory** = `web/`.
2. Variável de ambiente:

   ```
   NEXT_PUBLIC_API_URL=https://<seu-backend>.up.railway.app/v1
   ```

3. Deploy. A URL final de acesso é `https://<projeto>.vercel.app/auth`.
4. Atualize `CORS_ORIGIN` no backend com a URL real da Vercel e redeploy o backend.

---

## Credenciais de teste (criadas pelo seed)

| Usuário     | Email                          | Senha            | Papel         |
|-------------|--------------------------------|------------------|---------------|
| Admin       | admin@demo-church.com.br       | Admin@2024       | Acesso total  |
| Pastor      | pastor@demo-church.com.br      | Pastor@2024      | Gestão geral  |
| Tesoureiro  | tesoureiro@demo-church.com.br  | Tesoureiro@2024  | Financeiro    |
| Secretária  | secretaria@demo-church.com.br  | Secretaria@2024  | Membros/Eventos |

Troque essas senhas antes de entregar a uma igreja real.

---

## Criar uma nova igreja

O seed (`backend/prisma/seed.ts`) é idempotente e cria a "Igreja Demo". Para uma nova
igreja, edite os dados em `seed.ts` (ou crie um novo script copiando o padrão) e rode
`npm run seed`. Cada igreja é isolada por `churchId` em todas as tabelas.

---

## Importação de membros

O arquivo `template-importacao-membros.xlsx` (na raiz) traz os cabeçalhos esperados e
uma linha de exemplo. A importação em si é entregue na Fase 5; o template já define o
contrato de colunas: `nome, email, telefone, cpf, data_nascimento, endereco, cidade,
status, cargo`.

---

## Módulo futuro — Rede social / comunidade (DESABILITADO)

A pasta `backend/src/realtime/` contém um gateway WebSocket (Socket.io) **preparado mas
não ativado** — `RealtimeModule` não é importado no `AppModule`, então nada inicia em
produção. Para ativar:

1. Importe `RealtimeModule` no `AppModule`.
2. Configure Redis Pub/Sub para presença e mensagens em escala.
3. Ajuste o CORS no decorator `@WebSocketGateway`.

Roadmap do módulo: feed, presença ao vivo, reações/stickers, comentários em tempo real
em cultos/células e push (Firebase FCM). Stack planejada: Socket.io + Redis, WebRTC/LiveKit,
S3/Cloudflare R2, FCM.

---

## Estrutura

```
igreja360/
├── backend/   # NestJS + Prisma (API)
├── web/       # Next.js (painel admin)
└── template-importacao-membros.xlsx
```

## Notas de manutenção

- Erros são tratados com mensagens em português; o frontend tem estados de loading.
- TypeScript em modo `strict` nos dois projetos.
- Após alterar `schema.prisma`: `npx prisma migrate dev` (local) — em produção o deploy
  roda `prisma migrate deploy` automaticamente.
- Contato comercial (botão de assinatura): WhatsApp
  `https://wa.me/5511999999999?text=Olá!%20Quero%20assinar%20o%20Igreja360`.
```
