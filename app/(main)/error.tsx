"use client";

/*
  error.tsx — Error boundary para el route group (main).

  ¿Por qué "use client"?
  Next.js requiere que error.tsx sea un Client Component porque necesita
  capturar errores de JavaScript en el lado del cliente con el prop `reset`.

  Cuándo se muestra:
  - Cuando un Server Component de cualquier ruta en (main) lanza una excepción
  - Cuando hay un error en tiempo de ejecución dentro del árbol de componentes

  `reset` es una función que Next.js inyecta para reintentar el render
  sin recargar toda la página.
*/

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl border border-negative-400/30 bg-negative-900 text-negative-400 text-lg">
        <AlertTriangle aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
        Runtime Error
      </p>
      <h2 className="mt-3 text-xl font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        {error.message || "An unexpected error occurred loading this section."}
      </p>

      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Digest del error — útil para debugging en producción */}
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-text-muted">
          Digest: {error.digest}
        </p>
      )}
    </section>
  );
}
