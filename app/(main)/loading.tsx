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
    <section className="flex flex-1 flex-col animate-pulse">
      {/* Skeleton del header sticky */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-8 py-4 backdrop-blur">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="mt-3 h-7 w-56 rounded-lg bg-white/10" />
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Skeleton de stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-surface-card p-5"
            >
              <div className="mb-5 h-1 rounded-full bg-white/10" />
              <div className="h-3 w-20 rounded-full bg-white/10" />
              <div className="mt-4 h-7 w-32 rounded-lg bg-white/10" />
              <div className="mt-3 h-3 w-24 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        {/* Skeleton de tabla principal */}
        <div className="rounded-xl border border-white/10 bg-surface-card">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="mt-2 h-3 w-48 rounded-full bg-white/10" />
          </div>
          <div className="divide-y divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 rounded-lg bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded-full bg-white/10" />
                  <div className="h-3 w-28 rounded-full bg-white/[0.06]" />
                </div>
                <div className="h-4 w-20 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
