"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { tx } from "@/lib/i18n/config";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const locale = useLocale();
  const t = (text: string) => tx(locale, text);

  useEffect(() => {
    // Captura en Sentry desde el cliente (contexto del navegador). No-op sin DSN.
    Sentry.captureException(error);
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        digest: error.digest,
        location: "app-main-error-boundary",
        message: error.message,
        name: error.name,
      }),
    });
  }, [error]);

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl border border-negative-400/30 bg-negative-900 text-lg text-negative-400">
        <AlertTriangle aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
        {t("Error de la app")}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-text-primary">
        {t("Algo salio mal")}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        {error.message || t("No pudimos cargar esta seccion. Puedes reintentar o volver al dashboard.")}
      </p>

      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>{t("Reintentar")}</Button>
        <Link
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
          href="/dashboard"
        >
          {t("Volver al dashboard")}
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-xs text-text-muted">
          Digest: {error.digest}
        </p>
      )}
    </section>
  );
}
