import type { NextAuthConfig } from "next-auth";

// Configuração "edge-safe": sem providers que dependem do Prisma/Node.
// Usada pelo middleware/proxy (Edge Runtime) só para checar se existe sessão válida.
// A configuração completa (com o Credentials provider) está em src/lib/auth.ts.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
