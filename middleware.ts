import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/*
  Middleware Edge-safe — usa authConfig sin Prisma.
  El callback `authorized` en authConfig decide si redirigir a /sign-in.
*/
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
