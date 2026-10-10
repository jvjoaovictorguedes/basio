# Basio Studio

Ferramenta de gestão de conteúdo para uma social media freelancer que atende vários
clientes: produção em kanban, calendário editorial, central da marca, banco de ideias,
documentos e gestão de acessos — tudo isolado por cliente.

## Stack

- [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth.js](https://authjs.dev) (Credentials) para autenticação
- Arquivos (anexos de cartão e documentos) salvos como `bytea` no próprio Postgres —
  sem dependência de um serviço de storage externo

A autorização (administradora vê tudo; colaboradora só os clientes em que foi
adicionada) é garantida na camada de aplicação (`src/lib/authz.ts`), checada em toda
página e Server Action — não há Row Level Security no banco, já que não estamos no
Supabase.

## Rodando localmente

1. Suba um Postgres (local, Docker ou um serviço como Railway/Neon) e configure
   `DATABASE_URL` em `.env` (veja `.env.example`).
   - Para rodar via Docker: `docker compose up -d`.
2. Instale as dependências: `npm install`.
3. Rode as migrations: `npm run db:migrate`.
4. Crie a administradora inicial: `npm run db:seed` (cria `admin@studio.com` / `admin123`
   por padrão — configurável via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`).
5. Rode o servidor: `npm run dev`.

Troque a senha da administradora pela tela de **Perfil** assim que entrar.

## Convite de colaboradoras

O envio de e-mail não está configurado. Ao convidar uma colaboradora em
**Gestão de acessos**, o link do convite (`/convite/<token>`) aparece na própria tela
para você copiar e enviar manualmente.

## Deploy

Pensado para rodar em Vercel ou Railway com um Postgres gerenciado (Railway Postgres,
Vercel Postgres, Neon etc.) — basta apontar `DATABASE_URL` para o banco de produção e
definir `NEXTAUTH_URL` e `NEXTAUTH_SECRET`.
