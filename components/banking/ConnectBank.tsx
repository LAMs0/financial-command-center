"use client";

/*
  ConnectBank — UI para conectar/desconectar instituciones bancarias.
  ────────────────────────────────────────────────────────────────────
  Client Component: maneja el estado de "conectando/desconectando" con
  useTransition y llama a las Server Actions de lib/actions/banking.

  El proveedor activo (mock por defecto) lo decide el servidor; aquí solo
  recibimos la lista de instituciones disponibles y las ya conectadas.
*/

import { useState, useTransition } from "react";
import { Plus, Loader2, X, Landmark } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { connectInstitution, disconnectInstitution } from "@/lib/actions/banking";
import type { BankInstitution } from "@/lib/banking";

interface ConnectedInstitution {
  name: string;
  color: string;
  accountCount: number;
}

interface ConnectBankProps {
  institutions: BankInstitution[];
  connected: ConnectedInstitution[];
  /** Nombre del proveedor activo, para el aviso de modo demo. */
  providerId: string;
}

export default function ConnectBank({ institutions, connected, providerId }: ConnectBankProps) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectedNames = new Set(connected.map((c) => c.name));
  const available = institutions.filter((i) => !connectedNames.has(i.name));

  function handleConnect(institutionId: string) {
    setError(null);
    setBusyId(institutionId);
    startTransition(async () => {
      const res = await connectInstitution(institutionId);
      if (res.error) setError(res.error);
      setBusyId(null);
    });
  }

  function handleDisconnect(name: string) {
    setError(null);
    setBusyId(name);
    startTransition(async () => {
      const res = await disconnectInstitution(name);
      if (res.error) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <Card padded={false}>
      <CardHeader
        title="Conectar banco"
        subtitle="Vincula una institución para sincronizar cuentas y movimientos"
        action={
          providerId === "mock" ? (
            <span className="rounded-md border border-warning-400/20 bg-warning-900 px-2 py-1 font-mono text-xs uppercase tracking-wide text-warning-400">
              Demo
            </span>
          ) : null
        }
      />

      <div className="space-y-5 p-5">
        {/* Instituciones conectadas */}
        {connected.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
              Conectadas
            </p>
            <div className="flex flex-wrap gap-2">
              {connected.map((inst) => (
                <div
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5"
                  key={inst.name}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: inst.color }} />
                  <span className="text-sm font-medium text-text-primary">{inst.name}</span>
                  <span className="text-xs text-text-muted">
                    {inst.accountCount} {inst.accountCount === 1 ? "cuenta" : "cuentas"}
                  </span>
                  <button
                    aria-label={`Desconectar ${inst.name}`}
                    className="grid h-6 w-6 place-items-center rounded-md text-text-muted transition hover:bg-negative-900 hover:text-negative-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => handleDisconnect(inst.name)}
                    type="button"
                  >
                    {busyId === inst.name ? (
                      <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instituciones disponibles para conectar */}
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            Disponibles
          </p>
          {available.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Landmark aria-hidden className="h-4 w-4" strokeWidth={1.8} />
              Todas las instituciones disponibles ya están conectadas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((inst) => (
                <button
                  className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-text-secondary transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:opacity-50"
                  disabled={pending}
                  key={inst.id}
                  onClick={() => handleConnect(inst.id)}
                  type="button"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: inst.color }} />
                  {inst.name}
                  <span className="text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{inst.country}</span>
                  {busyId === inst.id ? (
                    <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-brand-300" />
                  ) : (
                    <Plus aria-hidden className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-300" strokeWidth={2} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-negative-400/20 bg-negative-900 px-3 py-2 text-sm text-negative-400">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
