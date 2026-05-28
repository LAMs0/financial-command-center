"use client";

/*
  MonthSelector — tabs de selección de mes.

  Lee y escribe en MonthContext. Cualquier componente que también lea
  el contexto se actualiza automáticamente al cambiar el mes.

  Diseño: pills horizontales, el activo con fondo brand, los demás ghost.
  En mobile: scroll horizontal para no cortar los tabs.
*/

import { useMonth } from "@/contexts/MonthContext";
import type { MonthlySnapshot } from "@/lib/mock-data";

interface MonthSelectorProps {
  months: MonthlySnapshot[];
}

export default function MonthSelector({ months }: MonthSelectorProps) {
  const { selectedMonth, setSelectedMonth } = useMonth();

  return (
    <div
      aria-label="Select month"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
      role="tablist"
    >
      {months.map((snapshot) => {
        const isActive = snapshot.month === selectedMonth;

        return (
          <button
            aria-selected={isActive}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "border-brand-400/40 bg-brand-500/20 text-brand-300"
                : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            }`}
            key={snapshot.month}
            onClick={() => setSelectedMonth(snapshot.month)}
            role="tab"
            type="button"
          >
            {snapshot.label}
          </button>
        );
      })}
    </div>
  );
}
