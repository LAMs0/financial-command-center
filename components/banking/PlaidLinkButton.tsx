"use client";

/*
  PlaidLinkButton — Botón que abre el widget de Plaid Link (modo "link").
  ────────────────────────────────────────────────────────────────────────
  Flujo en el cliente:
    1. Al hacer clic, pedimos un link_token a la server action createPlaidLinkToken.
    2. Con ese token inicializamos usePlaidLink; cuando el widget está "ready"
       lo abrimos automáticamente.
    3. El usuario elige su banco e ingresa credenciales DENTRO del widget de
       Plaid (sandbox: user_good / pass_good) — nunca pasan por nuestra app.
    4. onSuccess nos da un public_token, que mandamos a connectPlaidItem para
       canjearlo, cifrar el access_token y sincronizar cuentas/transacciones.

  Las keys de Plaid son secretas y viven solo en el servidor; aquí únicamente
  manejamos tokens efímeros.
*/

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Loader2, Landmark } from "lucide-react";
import { createPlaidLinkToken, connectPlaidItem } from "@/lib/actions/banking";

interface PlaidLinkButtonProps {
  onError: (message: string | null) => void;
}

export default function PlaidLinkButton({ onError }: PlaidLinkButtonProps) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [exchanging, startExchange] = useTransition();

  const onSuccess = useCallback(
    (publicToken: string) => {
      onError(null);
      startExchange(async () => {
        const res = await connectPlaidItem(publicToken);
        if (res.error) onError(res.error);
        setLinkToken(null);
        router.refresh(); // refresca cuentas/transacciones en la página
      });
    },
    [onError, router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null), // el usuario cerró el widget
  });

  // En cuanto tengamos token y el widget esté listo, lo abrimos.
  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  async function handleClick() {
    onError(null);
    setRequesting(true);
    const res = await createPlaidLinkToken();
    setRequesting(false);
    if (res.error || !res.linkToken) {
      onError(res.error ?? "No se pudo iniciar la conexión.");
      return;
    }
    setLinkToken(res.linkToken); // dispara el useEffect que abre el widget
  }

  const busy = requesting || exchanging || (linkToken !== null && !ready);

  return (
    <button
      className="group flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-brand-400/50 hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:opacity-50"
      disabled={busy}
      onClick={handleClick}
      type="button"
    >
      {busy ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-brand-300" />
      ) : (
        <Landmark aria-hidden className="h-4 w-4 text-brand-300" strokeWidth={1.8} />
      )}
      {exchanging ? "Sincronizando…" : busy ? "Abriendo…" : "Conectar un banco"}
    </button>
  );
}
