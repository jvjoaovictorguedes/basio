# Jota Studio

Ferramenta de gestão interna da Jô (social media freelancer): tudo o que ela precisa
fazer, de todos os clientes, num só lugar — "Minhas tarefas", clientes, estratégia,
banco de ideias, documentos e contratos, anotações, tarefas internas e páginas
personalizadas. Uso exclusivo dela; nenhum cliente acessa esta aplicação.

O banco de dados é compartilhado com uma segunda aplicação (futura), o **KardoJota** —
o espaço de produção usado junto com cada cliente (kanban, calendário, aprovações,
pedidos de material). O schema do Prisma já modela as duas; só o Jota Studio tem
telas construídas aqui.

## Stack

- [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth.js](https://authjs.dev) (Credentials) para autenticação — usuária única
- Arquivos (documentos, anotações, páginas personalizadas) salvos como `bytea` no
  próprio Postgres — sem dependência de um serviço de storage externo

A autorização é simples: qualquer sessão válida tem acesso total (é uma ferramenta de
uma única usuária). Checada em `src/lib/authz.ts`, em toda página e Server Action.

## Rodando localmente

1. Suba um Postgres (local, Docker ou um serviço como Railway/Neon) e configure
   `DATABASE_URL` em `.env` (veja `.env.example`).
   - Para rodar via Docker: `docker compose up -d`.
2. Instale as dependências: `npm install`.
3. Rode as migrations: `npm run db:migrate`.
4. Crie a usuária inicial: `npm run db:seed` (cria `jo@jotastudio.com` / `jota123`
   por padrão — configurável via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`).
5. Rode o servidor: `npm run dev`.

## Modelo de dados

`prisma/schema.prisma` cobre as duas aplicações: `Client`, `ClientContact`,
`PipelineStage`, `ContentCard`, `CardComment`, `CardApproval`, `CardAttachment`,
`IdeaBank` (ideias e pedidos de material do cliente), `StrategyPage`, `DocumentFolder`/
`Document` (com contratos e vencimento), `Note`, `InternalTask` e `CustomPage` (páginas
de texto, lista ou pasta, no menu geral ou dentro de um cliente).

## Deploy

Pensado para rodar em Vercel ou Railway com um Postgres gerenciado (Railway Postgres,
Vercel Postgres/Prisma Postgres, Neon etc.) — basta apontar `DATABASE_URL` para o banco
de produção e definir `NEXTAUTH_URL` e `NEXTAUTH_SECRET`.
