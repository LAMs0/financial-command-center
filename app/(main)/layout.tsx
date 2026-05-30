import Sidebar, { MobileNav } from "@/components/layout/Sidebar";
import RouteTransition from "@/components/layout/RouteTransition";
import { MonthProvider } from "@/contexts/MonthContext";
import { getMonthlyHistory } from "@/lib/data";
import { auth, signOut } from "@/auth";

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

  MonthProvider también es Client Component pero lo inicializamos aquí
  en el Server Component pasando los datos históricos como props.
  Así el servidor hace el trabajo pesado y el cliente solo mantiene
  el estado del mes seleccionado.
*/

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [monthlyHistory, session] = await Promise.all([
    getMonthlyHistory(),
    auth(),
  ]);
  const defaultMonth = monthlyHistory[monthlyHistory.length - 1].month;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/sign-in" });
  }

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  return (
    <MonthProvider history={monthlyHistory} defaultMonth={defaultMonth}>
      <div className="flex min-h-screen bg-[image:var(--app-shell-bg)] text-text-primary">
        <Sidebar history={monthlyHistory} user={user} signOutAction={handleSignOut} />
        {/* flex-1 hace que el contenido ocupe todo el ancho restante */}
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav user={user} signOutAction={handleSignOut} />
          <RouteTransition>{children}</RouteTransition>
        </div>
      </div>
    </MonthProvider>
  );
}
