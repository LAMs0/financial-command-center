import type { Account } from "@/types/finance";

/*
  Datos mock de cuentas bancarias.

  ¿Por qué separar esto en su propio archivo?
  Cuando llegue el Paso de integración real, solo reemplazamos
  este archivo por una llamada a la API — los componentes no se tocan.
*/
export const mockAccounts: Account[] = [
  {
    id: "acc-001",
    name: "BBVA Débito",
    institution: "BBVA",
    type: "checking",
    balance: 28450.75,
    currency: "MXN",
    lastUpdated: "2025-05-27",
    color: "#004481",
  },
  {
    id: "acc-002",
    name: "Nu Ahorro",
    institution: "Nu",
    type: "savings",
    balance: 52300.0,
    currency: "MXN",
    lastUpdated: "2025-05-27",
    color: "#820AD1",
  },
  {
    id: "acc-003",
    name: "HSBC Nómina",
    institution: "HSBC",
    type: "checking",
    balance: 12800.5,
    currency: "MXN",
    lastUpdated: "2025-05-26",
    color: "#DB0011",
  },
  {
    id: "acc-004",
    name: "Efectivo",
    institution: "Personal",
    type: "cash",
    balance: 3200.0,
    currency: "MXN",
    lastUpdated: "2025-05-27",
    color: "#16a34a",
  },
];
