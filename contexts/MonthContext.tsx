"use client";

/*
  MonthContext — estado global del mes seleccionado.

  ¿Por qué Context API y no useState local?
  ─────────────────────────────────────────
  Si guardáramos el mes seleccionado en el dashboard, los demás
  componentes (charts, stats) no podrían verlo. Context coloca el
  estado en un nivel superior al árbol de componentes para que
  cualquier descendiente lo lea o lo modifique.

  ¿Por qué no Zustand o Redux?
  ─────────────────────────────
  Para un caso tan puntual como "un valor compartido entre varios
  componentes", Context es suficiente y no añade dependencias.
  Zustand/Redux se justifican cuando el estado es complejo y cambia
  con mucha frecuencia.

  Patrón:
  1. createContext() — define el "canal" de comunicación
  2. MonthProvider   — componente que mantiene el estado y lo publica
  3. useMonth()      — hook que cualquier componente usa para leer/escribir
*/

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { MonthlySnapshot } from "@/lib/mock-data";

interface MonthContextValue {
  /** Formato "YYYY-MM", ej: "2025-05" */
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  /** Snapshot del mes seleccionado (undefined si no hay datos) */
  snapshot: MonthlySnapshot | undefined;
}

const MonthContext = createContext<MonthContextValue | null>(null);

interface MonthProviderProps {
  children: ReactNode;
  /** Todos los snapshots disponibles, pasados desde el Server Component */
  history: MonthlySnapshot[];
  /** Mes inicial (el más reciente por defecto) */
  defaultMonth: string;
}

export function MonthProvider({
  children,
  history,
  defaultMonth,
}: MonthProviderProps) {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const snapshot = history.find((h) => h.month === selectedMonth);

  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth, snapshot }}>
      {children}
    </MonthContext.Provider>
  );
}

/**
 * Hook para consumir el MonthContext desde cualquier Client Component.
 * Lanza un error claro si se usa fuera del MonthProvider.
 */
export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext);
  if (!ctx) {
    throw new Error("useMonth() must be used inside <MonthProvider>");
  }
  return ctx;
}
