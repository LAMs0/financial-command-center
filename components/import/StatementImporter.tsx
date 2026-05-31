"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  Flag,
  Landmark,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type { DetectedAccount, ParsedStatement, ParsedTransaction } from "@/lib/import/types";
import { saveImportedStatement } from "@/app/(main)/import/actions";
import { formatCurrency } from "@/lib/formatters";

// ── Tipos de paso del wizard ───────────────────────────────────────────────

type Step = "upload" | "review" | "success";

// ── Componente principal ───────────────────────────────────────────────────

export default function StatementImporter() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [account, setAccount] = useState<DetectedAccount | null>(null);
  const [importGoals, setImportGoals] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleParsed(result: ParsedStatement) {
    setParsed(result);
    setAccount(result.account);
    setImportGoals(result.goals.length > 0);
    setStep("review");
  }

  function handleSave() {
    if (!parsed || !account) return;
    startTransition(async () => {
      const result = await saveImportedStatement({
        account,
        transactions: parsed.transactions,
        goals: importGoals ? parsed.goals : [],
      });
      if (result?.error) {
        alert(result.error);
      } else {
        setStep("success");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      {step === "upload" && <UploadStep onParsed={handleParsed} />}
      {step === "review" && parsed && account && (
        <ReviewStep
          parsed={parsed}
          account={account}
          importGoals={importGoals}
          onAccountChange={setAccount}
          onImportGoalsChange={setImportGoals}
          onBack={() => setStep("upload")}
          onSave={handleSave}
          isSaving={isPending}
        />
      )}
      {step === "success" && parsed && <SuccessStep parsed={parsed} />}
    </div>
  );
}

// ── Paso 1: Upload ─────────────────────────────────────────────────────────

function UploadStep({ onParsed }: { onParsed: (r: ParsedStatement) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/statement", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      onParsed(data as ParsedStatement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing file");
    } finally {
      setIsLoading(false);
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Zona de drop */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
          isDragging
            ? "border-brand-400 bg-brand-500/10"
            : "border-white/20 hover:border-white/30 hover:bg-white/[0.02]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
            <p className="text-sm text-text-secondary">Analyzing your statement…</p>
          </div>
        ) : (
          <>
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-brand-400/30 bg-brand-500/10">
              <Upload aria-hidden="true" className="h-7 w-7 text-brand-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-text-primary">Drop your bank statement here</p>
            <p className="mt-1 text-sm text-text-secondary">
              CSV, OFX o PDF — BBVA, Santander, Nu, Banamex, HSBC, Banorte y más
            </p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/[0.1]"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <FileText aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Browse files
            </button>
            <input
              accept=".csv,.ofx,.qfx,.txt,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              ref={inputRef}
              type="file"
            />
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-negative-400/20 bg-negative-900 px-4 py-3">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-negative-400" strokeWidth={1.8} />
          <p className="text-sm text-negative-400">{error}</p>
        </div>
      )}

      {/* Info de formatos */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { title: "CSV", desc: "Banca en línea → Movimientos → Exportar CSV. El formato más común." },
          { title: "OFX / QFX", desc: "Estándar bancario. Compatible con Banamex, HSBC y bancos internacionales." },
          { title: "PDF", desc: "Extracto en PDF con texto seleccionable. No soporta PDFs escaneados (imagen)." },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
          >
            <p className="text-sm font-semibold text-text-primary">{f.title}</p>
            <p className="mt-1 text-xs text-text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Paso 2: Review ─────────────────────────────────────────────────────────

interface ReviewStepProps {
  parsed: ParsedStatement;
  account: DetectedAccount;
  importGoals: boolean;
  onAccountChange: (a: DetectedAccount) => void;
  onImportGoalsChange: (v: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

function ReviewStep({
  parsed,
  account,
  importGoals,
  onAccountChange,
  onImportGoalsChange,
  onBack,
  onSave,
  isSaving,
}: ReviewStepProps) {
  const income = parsed.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = parsed.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const confidenceLabel =
    parsed.confidence >= 0.85 ? "High confidence" :
    parsed.confidence >= 0.6  ? "Medium confidence" :
    "Low confidence — please review";

  const confidenceColor =
    parsed.confidence >= 0.85 ? "text-positive-400" :
    parsed.confidence >= 0.6  ? "text-warning-400" :
    "text-negative-400";

  return (
    <div className="space-y-5">
      {/* Header de resultado */}
      <div className="rounded-xl border border-white/10 bg-surface-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BankIcon bank={parsed.bank} />
              <p className="font-semibold text-text-primary">{parsed.bankLabel}</p>
            </div>
            <p className={`mt-1 text-xs ${confidenceColor}`}>{confidenceLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">
              {parsed.dateRange.from} → {parsed.dateRange.to}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {parsed.transactions.length} transactions
            </p>
          </div>
        </div>

        {parsed.warnings.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {parsed.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-warning-400">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                {w}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Balance", value: formatCurrency(account.balance, account.currency), color: "text-text-primary" },
          { label: "Income", value: formatCurrency(income, account.currency), color: "text-positive-400" },
          { label: "Expenses", value: formatCurrency(expenses, account.currency), color: "text-negative-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-surface-card p-4 text-center">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`mt-1.5 text-base font-semibold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Configuración de la cuenta — editable */}
      <AccountConfig account={account} onChange={onAccountChange} />

      {/* Metas detectadas */}
      {parsed.goals.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flag aria-hidden="true" className="h-4 w-4 text-brand-400" strokeWidth={1.8} />
              <p className="font-medium text-text-primary">Goal detected</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-text-muted">Import as goal</span>
              <input
                checked={importGoals}
                className="h-4 w-4 cursor-pointer accent-brand-500"
                onChange={(e) => onImportGoalsChange(e.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
          {parsed.goals.map((g) => (
            <div key={g.name} className="mt-3 flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
              <span className="text-xl">{g.icon}</span>
              <div>
                <p className="text-sm font-medium text-text-primary">{g.name}</p>
                <p className="text-xs text-text-muted capitalize">{g.category.replace("_", " ")} · {formatCurrency(g.currentAmount, g.currency)} saved</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview de transacciones */}
      <TransactionPreview transactions={parsed.transactions.slice(0, 6)} currency={account.currency} />

      {/* Acciones */}
      <div className="flex items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08]"
          onClick={onBack}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Cancel
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/15 px-5 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          )}
          {isSaving ? "Importing…" : `Import ${parsed.transactions.length} transactions`}
        </button>
      </div>
    </div>
  );
}

// ── Sub-componente: configuración de cuenta editable ──────────────────────

function AccountConfig({
  account,
  onChange,
}: {
  account: DetectedAccount;
  onChange: (a: DetectedAccount) => void;
}) {
  const kindOptions: Array<{ value: DetectedAccount["kind"]; label: string; icon: React.ReactNode }> = [
    { value: "financial_account", label: "Bank account", icon: <Landmark className="h-4 w-4" strokeWidth={1.8} /> },
    { value: "credit_card",       label: "Credit card",  icon: <CreditCard className="h-4 w-4" strokeWidth={1.8} /> },
    { value: "goal",              label: "Savings goal", icon: <Flag className="h-4 w-4" strokeWidth={1.8} /> },
  ];

  const accountTypeOptions = [
    { value: "checking", label: "Checking" },
    { value: "savings",  label: "Savings" },
    { value: "cash",     label: "Cash" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-surface-card p-5">
      <p className="mb-4 text-sm font-semibold text-text-primary">Account details</p>

      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-xs text-text-muted" htmlFor="acc-name">Name</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400/50 focus:outline-none"
            id="acc-name"
            onChange={(e) => onChange({ ...account, name: e.target.value })}
            type="text"
            value={account.name}
          />
        </div>

        {/* Institución */}
        <div>
          <label className="mb-1.5 block text-xs text-text-muted" htmlFor="acc-inst">Institution</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400/50 focus:outline-none"
            id="acc-inst"
            onChange={(e) => onChange({ ...account, institution: e.target.value })}
            type="text"
            value={account.institution}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tipo de registro */}
          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Type</label>
            <div className="flex flex-col gap-1.5">
              {kindOptions.map((opt) => (
                <button
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    account.kind === opt.value
                      ? "border-brand-400/40 bg-brand-500/10 text-brand-300"
                      : "border-white/10 bg-white/[0.02] text-text-secondary hover:border-white/20"
                  }`}
                  key={opt.value}
                  onClick={() => onChange({ ...account, kind: opt.value })}
                  type="button"
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account subtype (solo para financial_account) */}
          {account.kind === "financial_account" && (
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Account subtype</label>
              <div className="flex flex-col gap-1.5">
                {accountTypeOptions.map((opt) => (
                  <button
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      account.accountType === opt.value
                        ? "border-brand-400/40 bg-brand-500/10 text-brand-300"
                        : "border-white/10 bg-white/[0.02] text-text-secondary hover:border-white/20"
                    }`}
                    key={opt.value}
                    onClick={() => onChange({ ...account, accountType: opt.value as DetectedAccount["accountType"] })}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Últimos 4 dígitos (solo para tarjeta) */}
          {account.kind === "credit_card" && (
            <div>
              <label className="mb-1.5 block text-xs text-text-muted" htmlFor="cc-last4">Last 4 digits</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary focus:border-brand-400/50 focus:outline-none"
                id="cc-last4"
                maxLength={4}
                onChange={(e) => onChange({ ...account, lastFourDigits: e.target.value })}
                placeholder="1234"
                type="text"
                value={account.lastFourDigits ?? ""}
              />
              <label className="mb-1.5 mt-3 block text-xs text-text-muted" htmlFor="cc-limit">Credit limit</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary focus:border-brand-400/50 focus:outline-none"
                id="cc-limit"
                min={0}
                onChange={(e) => onChange({ ...account, limit: parseFloat(e.target.value) || 0 })}
                placeholder="50000"
                type="number"
                value={account.limit ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: preview de transacciones ──────────────────────────────

function TransactionPreview({
  transactions,
  currency,
}: {
  transactions: ParsedTransaction[];
  currency: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? transactions : transactions.slice(0, 4);

  return (
    <div className="rounded-xl border border-white/10 bg-surface-card">
      <div className="border-b border-white/[0.06] px-5 py-3.5">
        <p className="text-sm font-semibold text-text-primary">Transaction preview</p>
        <p className="text-xs text-text-muted">Showing {visible.length} of {transactions.length}</p>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {visible.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">{t.description}</p>
              <p className="text-xs text-text-muted">{t.date} · <span className="capitalize">{t.category}</span></p>
            </div>
            <span className={`tabular-nums text-sm font-medium ${
              t.type === "income" ? "text-positive-400" :
              t.type === "transfer" ? "text-info-400" :
              "text-negative-400"
            }`}>
              {t.type === "expense" ? "-" : "+"}{formatCurrency(t.amount, currency as "MXN" | "USD" | "EUR")}
            </span>
          </div>
        ))}
      </div>
      {transactions.length > 4 && (
        <button
          className="flex w-full items-center justify-center gap-1.5 py-3 text-xs text-text-muted transition hover:text-text-secondary"
          onClick={() => setShowAll((v) => !v)}
          type="button"
        >
          <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} strokeWidth={2} />
          {showAll ? "Show less" : `Show ${transactions.length - 4} more`}
        </button>
      )}
    </div>
  );
}

// ── Paso 3: Éxito ──────────────────────────────────────────────────────────

function SuccessStep({ parsed }: { parsed: ParsedStatement }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-positive-400/30 bg-positive-900">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-positive-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xl font-semibold text-text-primary">Import successful!</p>
        <p className="mt-2 text-sm text-text-secondary">
          {parsed.transactions.length} transactions imported from {parsed.bankLabel}.
        </p>
        {parsed.goals.length > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            {parsed.goals.length} goal{parsed.goals.length !== 1 ? "s" : ""} created.
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <a
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08]"
          href="/accounts"
        >
          View accounts
        </a>
        <a
          className="inline-flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/25"
          href="/transactions"
        >
          View transactions
          <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}

// ── Helper: ícono de banco ─────────────────────────────────────────────────

function BankIcon({ bank }: { bank: string }) {
  return (
    <div className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
      <Landmark aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.8} />
    </div>
  );
}
