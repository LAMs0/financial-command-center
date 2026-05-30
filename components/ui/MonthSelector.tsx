"use client";

/*
  MonthSelector — tabs de selección de mes.

  Lee y escribe en MonthContext. Cualquier componente que también lea
  el contexto se actualiza automáticamente al cambiar el mes.

  Diseño: pills horizontales, el activo con fondo brand, los demás ghost.
  En mobile: scroll horizontal para no cortar los tabs.
*/

import { useMonth } from "@/contexts/MonthContext";
import type { MonthlySnapshot } from "@/types/finance";
import type { KeyboardEvent } from "react";

interface MonthSelectorProps {
  months: MonthlySnapshot[];
}

export default function MonthSelector({ months }: MonthSelectorProps) {
  const { selectedMonth, setSelectedMonth } = useMonth();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? months.length - 1
          : event.key === "ArrowLeft"
            ? Math.max(index - 1, 0)
            : Math.min(index + 1, months.length - 1);
    const nextMonth = months[nextIndex]?.month;
    if (!nextMonth) return;

    setSelectedMonth(nextMonth);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  }

  return (
    <div
      aria-label="Select month"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
      role="tablist"
    >
      {months.map((snapshot, index) => {
        const isActive = snapshot.month === selectedMonth;

        return (
          <button
            aria-selected={isActive}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              isActive
                ? "border-brand-400/40 bg-brand-500/20 text-brand-300"
                : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-text-primary"
            }`}
            key={snapshot.month}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => setSelectedMonth(snapshot.month)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {snapshot.label}
          </button>
        );
      })}
    </div>
  );
}
