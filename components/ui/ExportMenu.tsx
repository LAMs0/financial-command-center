"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  ChevronDown,
} from "lucide-react";

type ExportItem = {
  label: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  filename: string;
};

interface ExportMenuProps {
  /** Qué datasets CSV mostrar en el menú */
  datasets?: Array<"transactions" | "accounts" | "cards" | "goals" | "budgets">;
  /** Si mostrar la opción de reporte PDF */
  showReport?: boolean;
}

const DATASET_META: Record<string, { label: string; description: string }> = {
  transactions: { label: "Transactions CSV",  description: "All transaction records" },
  accounts:     { label: "Accounts CSV",       description: "Bank account balances" },
  cards:        { label: "Credit Cards CSV",   description: "Card balances & utilization" },
  goals:        { label: "Goals CSV",          description: "Savings goals progress" },
  budgets:      { label: "Budget CSV",         description: "Category budget vs spent" },
};

export default function ExportMenu({
  datasets = ["transactions"],
  showReport = true,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const items: ExportItem[] = [
    ...datasets.map((ds) => ({
      label: DATASET_META[ds].label,
      description: DATASET_META[ds].description,
      icon: <FileSpreadsheet aria-hidden="true" className="h-4 w-4 text-positive-400" strokeWidth={1.8} />,
      url: `/api/export/transactions?dataset=${ds}`,
      filename: ds,
    })),
    ...(showReport
      ? [{
          label: "Monthly Report PDF",
          description: "Full financial summary (2 pages)",
          icon: <FileText aria-hidden="true" className="h-4 w-4 text-info-400" strokeWidth={1.8} />,
          url: "/api/export/report",
          filename: "report",
        }]
      : []),
  ];

  async function handleDownload(item: ExportItem) {
    setLoading(item.filename);
    setOpen(false);

    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      // Extraer nombre de archivo del header Content-Disposition si está disponible
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] ?? item.filename;

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("[ExportMenu] download failed:", err);
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Export data"
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-text-secondary transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isLoading}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        <span>{isLoading ? "Exporting…" : "Export"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          aria-label="Export options"
          className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl shadow-black/40"
          role="menu"
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Export options
            </p>
          </div>

          <div className="p-1">
            {items.map((item) => (
              <button
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-brand-400"
                disabled={loading === item.filename}
                key={item.filename}
                onClick={() => handleDownload(item)}
                role="menuitem"
                type="button"
              >
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
                  {loading === item.filename
                    ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-text-muted" />
                    : item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
