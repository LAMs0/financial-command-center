"use client";

import { useRef, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50";

// ── Tipos de paso del wizard ───────────────────────────────────────────────

type Step = "upload" | "review" | "success";

// ── Componente principal ───────────────────────────────────────────────────

export default function StatementImporter() {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [account, setAccount] = useState<DetectedAccount | null>(null);
  const [importGoals, setImportGoals] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleParsed(result: ParsedStatement) {
    setSaveError(null);
    setParsed(result);
    setAccount(result.account);
    setImportGoals(result.goals.length > 0);
    setStep("review");
  }

  function handleSave() {
    if (!parsed || !account) return;
    setSaveError(null);
    startTransition(async () => {
      const result = await saveImportedStatement({
        account,
        transactions: parsed.transactions,
        goals: importGoals ? parsed.goals : [],
      });
      if (result?.error) {
        setSaveError(result.error);
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
          saveError={saveError}
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
      if (!res.ok) throw new Error(data.error ?? "No pudimos leer el archivo.");
      onParsed(data as ParsedStatement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo.");
    } finally {
      setIsLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

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
            <p className="text-sm text-text-secondary">Analizando tu estado de cuenta...</p>
          </div>
        ) : (
          <>
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-brand-400/30 bg-brand-500/10">
              <Upload aria-hidden="true" className="h-7 w-7 text-brand-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-text-primary">Arrastra tu estado de cuenta aqui</p>
            <p className="mt-1 text-sm text-text-secondary">
              CSV, Excel, OFX, PDF o foto/imagen. Chase, Bank of America, Wells Fargo, Amex, BBVA, Santander y mas.
            </p>
            <button
              className={`mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/[0.1] ${FOCUS_RING}`}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <FileText aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Buscar archivo
            </button>
            <input
              accept=".csv,.ofx,.qfx,.txt,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              ref={inputRef}
              type="file"
            />
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-negative-400/20 bg-negative-900 px-4 py-3" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-negative-400" strokeWidth={1.8} />
          <p className="text-sm text-negative-400">{error}</p>
        </div>
      )}

      {/* Info de formatos */}
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        {[
          { title: "CSV / Excel", desc: "Banca en linea -> Movimientos -> Exportar. Es el formato mas confiable." },
          { title: "OFX / QFX", desc: "Estandar bancario. Compatible con Banamex, HSBC y bancos internacionales." },
          { title: "PDF", desc: "Extracto en PDF. Si esta escaneado, se lee automaticamente con OCR." },
          { title: "Foto / Imagen", desc: "Sube una foto o captura del estado de cuenta; se lee con OCR." },
        ].map((f) => (
          <div
            key={f.title}
            className="h-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
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
  saveError: string | null;
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
  saveError,
}: ReviewStepProps) {
  const income = parsed.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = parsed.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const confidenceLabel =
    parsed.confidence >= 0.85 ? "Confianza alta" :
    parsed.confidence >= 0.6  ? "Confianza media" :
    "Confianza baja - revisa antes de importar";

  const confidence = getConfidencePresentation(parsed.confidence);
  const ConfidenceIcon = confidence.icon;

  return (
    <div className="space-y-5">
      {/* Header de resultado */}
      <div className={`rounded-xl border bg-surface-card p-5 ${confidence.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BankIcon bank={parsed.bank} />
              <p className="font-semibold text-text-primary">{parsed.bankLabel}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-lg ${confidence.bg}`}>
                <ConfidenceIcon
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 ${confidence.text}`}
                  strokeWidth={2}
                />
              </span>
              <p className={`text-xs font-medium ${confidence.text}`}>
                {confidenceLabel}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">
              {parsed.dateRange.from} / {parsed.dateRange.to}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {parsed.transactions.length} transacciones
            </p>
          </div>
        </div>

        {parsed.warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-warning-400/20 bg-warning-900 px-3 py-2.5" role="status">
            <p className="mb-2 text-xs font-semibold text-warning-400">
              Revisa estas advertencias antes de importar
            </p>
            {parsed.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-5 text-warning-400">
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
          { label: "Ingresos", value: formatCurrency(income, account.currency), color: "text-positive-400" },
          { label: "Gastos", value: formatCurrency(expenses, account.currency), color: "text-negative-400" },
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
              <p className="font-medium text-text-primary">Meta detectada</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-text-muted">Importar como meta</span>
              <input
                checked={importGoals}
                className={`h-4 w-4 cursor-pointer accent-brand-500 ${FOCUS_RING}`}
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
                <p className="text-xs text-text-muted capitalize">{g.category.replace("_", " ")} / {formatCurrency(g.currentAmount, g.currency)} ahorrado</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview de transacciones */}
      <TransactionPreview transactions={parsed.transactions.slice(0, 6)} currency={account.currency} />

      {saveError && (
        <div className="flex items-start gap-3 rounded-xl border border-negative-400/20 bg-negative-900 px-4 py-3" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-negative-400" strokeWidth={1.8} />
          <div>
            <p className="text-sm font-semibold text-negative-400">No se pudo guardar la importacion</p>
            <p className="mt-1 text-xs text-negative-400/90">{saveError}</p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between gap-3">
        <button
          className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08] ${FOCUS_RING}`}
          onClick={onBack}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Cancelar
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/15 px-5 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving ? (
            <span
              aria-hidden="true"
              className="grid h-5 w-5 place-items-center rounded-full bg-brand-500/20"
            >
              <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={2.4} />
            </span>
          ) : (
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          )}
          {isSaving ? "Importando..." : `Importar ${parsed.transactions.length} transacciones`}
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
    { value: "financial_account", label: "Cuenta bancaria", icon: <Landmark className="h-4 w-4" strokeWidth={1.8} /> },
    { value: "credit_card",       label: "Tarjeta de credito",  icon: <CreditCard className="h-4 w-4" strokeWidth={1.8} /> },
    { value: "goal",              label: "Meta de ahorro", icon: <Flag className="h-4 w-4" strokeWidth={1.8} /> },
  ];

  const accountTypeOptions = [
    { value: "checking", label: "Cheques" },
    { value: "savings",  label: "Ahorro" },
    { value: "cash",     label: "Efectivo" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-surface-card p-5">
      <p className="mb-4 text-sm font-semibold text-text-primary">Detalles de la cuenta</p>

      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-xs text-text-muted" htmlFor="acc-name">Nombre</label>
          <input
            className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400/50 focus:outline-none ${FOCUS_RING}`}
            id="acc-name"
            onChange={(e) => onChange({ ...account, name: e.target.value })}
            type="text"
            value={account.name}
          />
        </div>

        {/* Institución */}
        <div>
          <label className="mb-1.5 block text-xs text-text-muted" htmlFor="acc-inst">Institucion</label>
          <input
            className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400/50 focus:outline-none ${FOCUS_RING}`}
            id="acc-inst"
            onChange={(e) => onChange({ ...account, institution: e.target.value })}
            type="text"
            value={account.institution}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tipo de registro */}
          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Tipo</label>
            <div className="flex flex-col gap-1.5">
              {kindOptions.map((opt) => (
                <button
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${FOCUS_RING} ${
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
              <label className="mb-1.5 block text-xs text-text-muted">Subtipo de cuenta</label>
              <div className="flex flex-col gap-1.5">
                {accountTypeOptions.map((opt) => (
                  <button
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${FOCUS_RING} ${
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
              <label className="mb-1.5 block text-xs text-text-muted" htmlFor="cc-last4">Ultimos 4 digitos</label>
              <input
                className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary focus:border-brand-400/50 focus:outline-none ${FOCUS_RING}`}
                id="cc-last4"
                maxLength={4}
                onChange={(e) => onChange({ ...account, lastFourDigits: e.target.value })}
                placeholder="1234"
                type="text"
                value={account.lastFourDigits ?? ""}
              />
              <label className="mb-1.5 mt-3 block text-xs text-text-muted" htmlFor="cc-limit">Limite de credito</label>
              <input
                className={`w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-primary focus:border-brand-400/50 focus:outline-none ${FOCUS_RING}`}
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
        <p className="text-sm font-semibold text-text-primary">Vista previa de transacciones</p>
        <p className="text-xs text-text-muted">Mostrando {visible.length} de {transactions.length}</p>
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
          className={`flex w-full items-center justify-center gap-1.5 py-3 text-xs text-text-muted transition hover:text-text-secondary ${FOCUS_RING}`}
          onClick={() => setShowAll((v) => !v)}
          type="button"
        >
          <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} strokeWidth={2} />
          {showAll ? "Mostrar menos" : `Mostrar ${transactions.length - 4} mas`}
        </button>
      )}
    </div>
  );
}

// ── Paso 3: Éxito ──────────────────────────────────────────────────────────

function SuccessStep({ parsed }: { parsed: ParsedStatement }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-positive-400/20 bg-surface-card px-6 py-12 text-center shadow-2xl shadow-black/20"
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {!shouldReduceMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-8 flex justify-between">
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.span
              animate={{ opacity: [0, 1, 0], y: [0, -18, -34] }}
              className="h-1.5 w-1.5 rounded-full bg-brand-400"
              key={index}
              transition={{ duration: 1.25, delay: index * 0.09, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
      <motion.div
        animate={shouldReduceMotion ? undefined : { scale: [0.92, 1.06, 1] }}
        className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-positive-400/30 bg-positive-900"
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-positive-400" strokeWidth={1.5} />
      </motion.div>
      <div>
        <p className="text-xl font-semibold text-text-primary">Importacion completada</p>
        <p className="mt-2 text-sm text-text-secondary">
          {parsed.transactions.length} transacciones importadas desde {parsed.bankLabel}.
        </p>
        {parsed.goals.length > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            {parsed.goals.length} meta{parsed.goals.length !== 1 ? "s" : ""} creada{parsed.goals.length !== 1 ? "s" : ""}.
          </p>
        )}
      </div>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.08] ${FOCUS_RING}`}
          href="/accounts"
        >
          Ver cuentas
        </a>
        <a
          className={`inline-flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/25 ${FOCUS_RING}`}
          href="/transactions"
        >
          Ver transacciones
          <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </a>
      </div>
    </motion.div>
  );
}

// ── Helper: ícono de banco ─────────────────────────────────────────────────

function getConfidencePresentation(confidence: number) {
  if (confidence >= 0.85) {
    return {
      bg: "bg-positive-900",
      border: "border-positive-400/25",
      icon: CheckCircle2,
      text: "text-positive-400",
    };
  }

  if (confidence >= 0.6) {
    return {
      bg: "bg-warning-900",
      border: "border-warning-400/25",
      icon: AlertTriangle,
      text: "text-warning-400",
    };
  }

  return {
    bg: "bg-negative-900",
    border: "border-negative-400/25",
    icon: AlertCircle,
    text: "text-negative-400",
  };
}

function BankIcon({ bank }: { bank: string }) {
  return (
    <div
      aria-label={bank}
      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04]"
      role="img"
    >
      <Landmark aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.8} />
    </div>
  );
}
