import Link from "next/link";
import { Compass } from "lucide-react";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const t = (text: string) => tx(locale, text);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-base bg-[image:var(--app-shell-bg)] px-4 text-center text-text-primary">
      <div className="mb-8 grid h-14 w-14 place-items-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-base font-bold text-brand-300">
        <Compass aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
        {t("Error 404")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-text-primary">
        {t("Pagina no encontrada")}
      </h1>
      <p className="mt-3 max-w-sm text-text-secondary">
        {t("Esta ruta no existe en Financial Command Center. Vuelve al dashboard para seguir trabajando.")}
      </p>

      <Link
        className="mt-8 rounded-lg border border-brand-400/40 bg-brand-500/15 px-5 py-2.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
        href="/dashboard"
      >
        {t("Volver al dashboard")}
      </Link>

      <p className="mt-16 text-xs text-text-muted">Financial Command Center</p>
    </main>
  );
}
