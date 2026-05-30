import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/*
  auth.ts — Configuración completa de Auth.js (Node.js runtime).

  Extiende authConfig con el PrismaAdapter (guarda usuarios/tokens en DB)
  y usa estrategia JWT para que el middleware Edge pueda verificar sesiones
  sin necesitar acceso a Prisma.

  Exporta:
  - auth()     → sesión activa en Server Components y API routes
  - handlers   → GET/POST para /api/auth/*
  - signIn()   → inicia OAuth (Server Actions)
  - signOut()  → cierra sesión (Server Actions)
*/

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // En el primer login, user existe — guardamos su id de DB en el token
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
