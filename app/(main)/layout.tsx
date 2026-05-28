import Sidebar, { MobileNav } from "@/components/layout/Sidebar";
import RouteTransition from "@/components/layout/RouteTransition";

/*
  Este layout envuelve TODAS las páginas del grupo (main):
  /dashboard, /accounts, /cards, /investments, /goals, /analytics.

  ¿Cómo funciona un route group?
  La carpeta `(main)` con paréntesis NO aparece en la URL.
  `/app/(main)/dashboard/page.tsx` → URL: `/dashboard`
  `/app/(main)/accounts/page.tsx`  → URL: `/accounts`

  Beneficio: podemos agregar más grupos en el futuro (ej: `(auth)` para
  /login y /register) sin sidebar, sin tocar este layout.

  Sidebar es Client Component (usa usePathname) pero este layout
  permanece Server Component — Next.js los compone automáticamente.
*/
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,#090b11_0%,#0c111b_48%,#111018_100%)] text-text-primary">
      <Sidebar />
      {/* flex-1 hace que el contenido ocupe todo el ancho restante */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <RouteTransition>{children}</RouteTransition>
      </div>
    </div>
  );
}
