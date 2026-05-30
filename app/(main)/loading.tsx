import { Skeleton, SkeletonCard, SkeletonListRow } from "@/components/ui";

/*
  loading.tsx — Skeleton de carga compartido para todo el route group (main).

  ¿Cómo funciona?
  Next.js App Router tiene Streaming built-in. Cuando navegas a una ruta,
  muestra este componente INMEDIATAMENTE mientras el Server Component
  de la página termina de ejecutarse (fetching de datos, cálculos, etc.).

  Al estar en app/(main)/, aplica a /dashboard, /accounts, /cards, etc.
  Si una ruta necesita su propio skeleton específico, crea un loading.tsx
  dentro de esa carpeta — tendrá prioridad sobre este.

  Los divs con animate-pulse simulan el contenido que va a aparecer
  (skeleton screens), lo que se siente más rápido que un spinner.
*/

export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading page" className="flex flex-1 flex-col">
      {/* Skeleton del header sticky */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-8 py-4 backdrop-blur">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="mt-3 h-7 w-56" />
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Skeleton de stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Skeleton de tabla principal */}
        <div className="rounded-xl border border-white/10 bg-surface-card">
          <div className="border-b border-white/10 px-5 py-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="mt-2 h-3 w-48 rounded-full" />
          </div>
          <div className="divide-y divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
