/*
  not-found.tsx — Página 404 global.

  Next.js muestra este componente cuando:
  1. Una ruta no existe (ej: /configuracion)
  2. Un Server Component llama a notFound() de next/navigation

  Al estar en app/ (raíz), aplica a toda la aplicación.
  Si una sección necesita su propio 404 (ej: /accounts/[id] no encontrado),
  crea not-found.tsx dentro de esa carpeta.
*/

import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[image:var(--app-shell-bg)] px-4 text-center text-text-primary">
      {/* Logo */}
      <div className="mb-8 grid h-14 w-14 place-items-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-base font-bold text-brand-300">
        <Compass aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
      </div>

      {/* Código de error */}
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
        Error 404
      </p>

      {/* Mensaje principal */}
      <h1 className="mt-3 text-3xl font-semibold text-white">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-text-secondary">
        This route doesn&apos;t exist in the Financial Command Center.
        Head back to your dashboard.
      </p>

      {/* Acción */}
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg border border-brand-400/40 bg-brand-500/15 px-5 py-2.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25"
      >
        Back to Dashboard
      </Link>

      {/* Decoración sutil */}
      <p className="mt-16 text-xs text-text-muted">
        Financial Command Center · Phase 1
      </p>
    </main>
  );
}
