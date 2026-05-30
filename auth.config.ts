import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/*
  Configuración Edge-safe de Auth.js — sin imports de Prisma/Node.js.
  Usada por el middleware (Edge Runtime) para verificar sesiones JWT
  sin tocar la base de datos.
*/
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/api/auth");
      if (isPublic) return true;
      if (isLoggedIn) return true;
      return false;
    },
  },
} satisfies NextAuthConfig;
