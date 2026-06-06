"use client";

/*
  DeleteCardButton — Eliminar una tarjeta de crédito con confirmación.
  ─────────────────────────────────────────────────────────────────────
  Acción destructiva, así que usa el patrón de DOS pasos (igual que el
  borrado de cuenta en el Sidebar):
    1er clic  → muestra advertencia + botones Cancelar / Confirmar.
    2do clic  → llama a la server action deleteCard y refresca la página.

  Recibe `locale` para traducir (tx es seguro en cliente: es solo un diccionario).
*/

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteCard } from "@/lib/actions/cards";
import { tx, type Locale } from "@/lib/i18n/config";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50";

interface DeleteCardButtonProps {
  cardId: string;
  cardName: string;
  locale: Locale;
}

export default function DeleteCardButton({ cardId, cardName, locale }: DeleteCardButtonProps) {
  const t = (text: string) => tx(locale, text);
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCard(cardId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setConfirm(false);
      router.refresh();
    });
  }

  if (!confirm) {
    return (
      <button
        aria-label={`${t("Eliminar tarjeta")}: ${cardName}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-text-muted transition hover:border-negative-400/30 hover:bg-negative-900 hover:text-negative-400 ${FOCUS_RING}`}
        onClick={() => setConfirm(true)}
        type="button"
      >
        <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} />
        {t("Eliminar")}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-negative-400/25 bg-negative-900/40 p-3">
      <p className="flex items-start gap-2 text-xs leading-5 text-warning-400">
        <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
        {t("Esta acción es permanente y no se puede deshacer. La tarjeta se eliminará de tu panel.")}
      </p>
      {error && <p className="mt-2 text-xs text-negative-400">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          className={`rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary ${FOCUS_RING}`}
          disabled={pending}
          onClick={() => {
            setConfirm(false);
            setError(null);
          }}
          type="button"
        >
          {t("Cancelar")}
        </button>
        <button
          className={`inline-flex items-center gap-1.5 rounded-lg border border-negative-400/25 bg-negative-900/70 px-3 py-1.5 text-xs font-medium text-negative-400 transition hover:border-negative-400/45 hover:bg-negative-900 disabled:opacity-50 ${FOCUS_RING}`}
          disabled={pending}
          onClick={handleDelete}
          type="button"
        >
          {pending ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} />
          )}
          {t("Sí, eliminar")}
        </button>
      </div>
    </div>
  );
}
