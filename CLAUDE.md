# Igreja360 — Contexto do Projeto (para o Claude Code)

> Coloque este arquivo na **raiz do repositório** (`igreja360/CLAUDE.md`). O Claude Code lê este arquivo automaticamente ao abrir a pasta e passa a conhecer o projeto.

## O que é

SaaS de gestão para igrejas evangélicas brasileiras. Tagline: "Gestão clara. Igreja saudável."
Monorepo com dois projetos: `backend/` (API) e `web/` (painel administrativo).

## Stack (obrigatória — não trocar)

- **Backend:** NestJS 10 (adapter Fastify) + Prisma 5 + PostgreSQL. Prefixo global de rotas: `/v1`.
- **Auth:** própria, com JWT (access 7d / refresh 30d) + bcrypt (bcryptjs). **NUNCA usar Supabase Auth.**
- **Frontend:** Next.js 14 (App Router) + Tailwind + componentes shadcn-style escritos à mão + lucide-react.
- **Deploy:** backend e frontend na **Railway** (via Docker no backend). Banco PostgreSQL na Railway. Fotos/banners são salvos como base64 no banco.

## Estrutura

```
igreja360/
├── backend/                 # API NestJS
│   ├── prisma/schema.prisma # modelos e enums (fonte da verdade do banco)
│   ├── prisma/seed.ts       # cria Igreja Demo + 4 usuários + dados de exemplo
│   ├── Dockerfile           # build de deploy (Railway)
│   └── src/
│       ├── auth/            # login/refresh/me, guards (JwtAuthGuard, RolesGuard), decorators
│       ├── prisma/          # PrismaService/PrismaModule
│       ├── members/  cells/  financial/  events/
│       ├── campaigns/  communications/  prayers/  reports/  settings/
│       ├── app.module.ts    # registra todos os módulos
│       └── main.ts          # bootstrap (prefixo /v1, ValidationPipe, CORS)
└── web/                     # painel Next.js
    ├── app/(auth)/auth/     # tela de login (split-screen)
    ├── app/(dashboard)/     # rotas protegidas: dashboard, members, cells, financial,
    │                        # events, campaigns, communications, prayers, reports, settings
    ├── components/          # ui/, layout/ (Sidebar, Header), e pastas por módulo
    └── lib/                 # api.ts, auth.ts, utils.ts, image.ts, e tipos por módulo
```

## Padrão de cada módulo (seguir ao criar novos)

- **Backend:** pasta com `*.module.ts`, `*.controller.ts`, `*.service.ts` e `dto/` (class-validator).
  - Service recebe sempre `churchId` e isola os dados por igreja (multi-tenant por `churchId`).
  - Controller usa `@UseGuards(JwtAuthGuard, RolesGuard)`, `@CurrentUser()` e `@Roles(...)`.
  - Registrar o módulo em `app.module.ts`.
- **Frontend:** tipo em `lib/<modulo>.ts`, formulário em `components/<modulo>/`,
  páginas em `app/(dashboard)/<modulo>/` (lista, `new/`, `[id]/edit/`, e `[id]/` quando há detalhe).
  - Chamadas via `import { api } from '@/lib/api'`; erros via `extractApiError`.

## Papéis (UserRole) e permissões

`SUPER_ADMIN, ADMIN, PASTOR, SECRETARY, TREASURER, LEADER, MEMBER`
- Financeiro / Relatórios: ADMIN, PASTOR, TREASURER.
- Eventos / Comunicações: ADMIN, PASTOR, SECRETARY.
- Membros / Células: ADMIN, PASTOR, SECRETARY, LEADER (excluir: ADMIN, PASTOR).
- Campanhas: ADMIN, PASTOR, TREASURER.
- Configurações da igreja: ADMIN, PASTOR. Trocar senha: qualquer usuário.

## Regras de código (manter)

- TypeScript `strict`; **não usar `any`**.
- Mensagens de erro e textos de UI **em português**.
- Datas só-data (nascimento, batismo, entrada): exibir com `formatDate` (parte ISO, sem fuso).
  Datas com hora (eventos): `formatDateTime`.
- Valores monetários (`Decimal` no Prisma) chegam como **string** na API — converter com `Number(...)`.
- Fotos/banners: comprimir no navegador (`lib/image.ts`) e enviar base64 no campo `photo`.

## Rodando localmente

Pré-requisitos: Node 20+, PostgreSQL (local ou um banco de dev na Railway).

### Backend
```bash
cd backend
# crie um .env com:
#   DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/igreja360"
#   JWT_SECRET="troque-isto"
#   JWT_EXPIRES_IN="7d"
#   JWT_REFRESH_SECRET="troque-isto-tambem"
#   JWT_REFRESH_EXPIRES_IN="30d"
#   PORT=3000
#   CORS_ORIGIN="http://localhost:3001"
npm install
npx prisma generate
npx prisma db push     # cria as tabelas
npm run seed           # cria Igreja Demo + usuários
npm run start:dev      # API em http://localhost:3000/v1
```

### Frontend
```bash
cd web
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/v1' > .env.local
npm install
npm run dev -- -p 3001 # painel em http://localhost:3001  (login em /auth)
```

## Credenciais de teste (seed)

- admin@demo-church.com.br / Admin@2024 (Administrador)
- pastor@demo-church.com.br / Pastor@2024
- tesoureiro@demo-church.com.br / Tesoureiro@2024
- secretaria@demo-church.com.br / Secretaria@2024

## Deploy (Railway)

- Dois serviços no mesmo projeto + um PostgreSQL.
- **Backend:** Root Directory = `backend`, builder = Dockerfile. Variáveis: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, os 4 `JWT_*`, `NODE_ENV=production`, `PORT=8080`, `CORS_ORIGIN=<url-do-frontend>`. O Dockerfile roda `prisma db push` + `prisma db seed` + `node dist/src/main.js` no start.
- **Frontend:** Root Directory = `web`. Variável: `NEXT_PUBLIC_API_URL=<url-do-backend>/v1`.
- Cada `git push` na branch `main` redeploya os dois serviços.
- **Não** versionar `railway.json` nem `package-lock.json` (o backend usa `npm install`, não `npm ci`).

## Como abrir no Claude Code

```bash
git clone https://github.com/ffabriciomnzs-cyber/igreja360.git
cd igreja360
claude
```
