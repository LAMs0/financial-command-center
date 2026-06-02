import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/*
  Configuración Edge-safe de Auth.js — sin imports de Prisma/Node.js.
  Usada por el middleware (Edge Runtime) para verificar sesiones JWT
  sin tocar la base de datos.
*/
export const authConfig = {
  // En producción la app corre detrás del proxy del host (Railway/Vercel).
  // trustHost permite que Auth.js confíe en el header Host para construir las
  // URLs de callback, en vez de exigir AUTH_URL fijo. Imprescindible al desplegar.
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/api/auth");
      if (isPublic) return true;
      if (isLoggedIn) return true;
      return false;
    },
  },
} satisfies NextAuthConfig;
