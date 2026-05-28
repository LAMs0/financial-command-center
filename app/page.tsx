import { redirect } from "next/navigation";

/*
  La raíz del sitio (/) redirige automáticamente al dashboard.
  Usamos `redirect()` de Next.js — es una redirección del lado del servidor
  (no se envía HTML al cliente, lo que es más rápido que un client-side redirect).

  Más adelante, si agregamos autenticación, este archivo será el punto donde
  redirigimos a /login o /dashboard según si hay sesión activa.
*/
export default function RootPage() {
  redirect("/dashboard");
}
