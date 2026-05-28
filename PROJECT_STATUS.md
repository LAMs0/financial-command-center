# Financial Command Center — Estado del Proyecto

## Nota actual del agente de diseno

El estado operativo del repo ya avanzo mas alla del resumen inicial de este documento:

- Layout principal activo en `app/(main)/layout.tsx` con `Sidebar` y `MobileNav`.
- Paginas activas: `/dashboard`, `/accounts`, `/cards`, `/investments`, `/transactions`, `/goals`, `/analytics`.
- Componentes UI base activos en `components/ui`: `Card`, `CardHeader`, `Badge`, `TransactionBadge`, `ProgressBar`, `StatCard`, `SectionHeader`.
- Las paginas principales ya fueron refinadas para usar esos componentes y mantener consistencia visual.

El contenido historico debajo queda como referencia de arranque, pero no refleja completamente el estado actual.

> Documento de handoff para coordinación entre agentes.
> Última actualización: 2026-05-27

---

## Resumen ejecutivo

Se inicializó el proyecto **Financial Command Center** desde cero con `create-next-app`. Se completaron los Pasos 1 y 2 del plan de Fase 1:

- ✅ Paso 1: Proyecto inicializado + Tailwind configurado con paleta premium + dark mode
- ✅ Paso 2: Tipos TypeScript + datos mock + utilidades de formateo y cálculo
- ⬜ Paso 3: Layout global (Sidebar + AppShell) — **PENDIENTE**
- ⬜ Paso 4: Componentes UI base (Card, Badge, Button, ProgressBar) — pendiente
- ⬜ Paso 5: Dashboard page — pendiente
- ⬜ Paso 6-7: Resto de páginas (Accounts, Cards, Investments, Transactions, Goals, Analytics) — pendiente

---

## Stack técnico

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16.2.6 | Framework principal, App Router |
| React | 19.2.4 | UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos (configuración vía CSS, NO tailwind.config.ts) |
| Geist Sans | — | Tipografía principal (via next/font/google) |
| ESLint | 9.x | Linting |

**Importante — Tailwind v4:** La configuración NO usa `tailwind.config.ts`. Todo el sistema de diseño vive en `app/globals.css` dentro del bloque `@theme {}`.

---

## Estructura de carpetas completa

```
Financial Command Center/
│
├── app/                          ← Rutas de Next.js (App Router)
│   ├── layout.tsx                ← Layout raíz global (dark mode, fuentes, metadata)
│   ├── page.tsx                  ← Redirige a /dashboard con server-side redirect
│   ├── globals.css               ← Sistema de diseño completo (Tailwind @theme)
│   ├── favicon.ico
│   ├── dashboard/
│   │   └── page.tsx              ← Placeholder activo (muestra "cargando...")
│   ├── accounts/                 ← Carpeta creada, sin page.tsx aún
│   ├── analytics/                ← Carpeta creada, sin page.tsx aún
│   ├── cards/                    ← Carpeta creada, sin page.tsx aún
│   ├── goals/                    ← Carpeta creada, sin page.tsx aún
│   ├── investments/              ← Carpeta creada, sin page.tsx aún
│   └── transactions/             ← Carpeta creada, sin page.tsx aún
│
├── components/                   ← Componentes reutilizables (todos VACÍOS aún)
│   ├── layout/                   ← Sidebar, TopBar, AppShell — PRÓXIMO PASO
│   ├── ui/                       ← Card, Badge, Button, ProgressBar — pendiente
│   ├── dashboard/                ← NetWorthCard, CashFlowCard, etc. — pendiente
│   ├── accounts/                 ← AccountCard — pendiente
│   ├── investments/              ← InvestmentCard — pendiente
│   └── goals/                    ← GoalCard — pendiente
│
├── lib/
│   ├── mock-data/
│   │   ├── index.ts              ← Barrel export de todos los datos mock
│   │   ├── accounts.ts           ← 4 cuentas (BBVA, Nu, HSBC, Efectivo)
│   │   ├── cards.ts              ← 3 tarjetas (Amex Gold, BBVA Azul, Nu Card)
│   │   ├── transactions.ts       ← 10 transacciones (ingresos, gastos, transferencias)
│   │   ├── investments.ts        ← 4 inversiones (VOO, AAPL, BTC, CETES)
│   │   └── goals.ts              ← 4 metas (emergencia, Japón, MacBook, depa)
│   ├── formatters.ts             ← formatCurrency, formatPercent, formatDate, formatCompact
│   └── calculations.ts           ← calculateNetWorth, calculateCashFlow, calculateCardUtilization, calculateInvestmentGain, calculateGoalProgress
│
├── types/
│   └── finance.ts                ← Todos los tipos TypeScript del dominio financiero
│
├── public/                       ← Assets estáticos (SVGs de Next.js por defecto)
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── next-env.d.ts
```

---

## Archivos clave — contenido y decisiones

### `app/globals.css` — Sistema de diseño

Usa Tailwind v4 con `@theme {}`. Define tokens con nombres semánticos que se convierten en clases utilitarias automáticamente.

**Paleta definida:**
```
Superficies:
  --color-surface-base:   #090b11   → bg-surface-base   (fondo principal de la app)
  --color-surface-card:   #111318   → bg-surface-card   (fondo de cards)
  --color-surface-raised: #181c24   → bg-surface-raised (cards hover / elevated)
  --color-surface-border: #1f2433   → border-surface-border

Brand / Accent (Emerald):
  --color-brand-300 a brand-900     → text-brand-400, bg-brand-500, etc.

Texto:
  --color-text-primary:   #f1f5f9   → text-text-primary
  --color-text-secondary: #94a3b8   → text-text-secondary
  --color-text-muted:     #475569   → text-text-muted

Semántica financiera:
  --color-positive-*      → verde (ingresos, ganancias)
  --color-negative-*      → rojo (gastos, pérdidas, deuda)
  --color-warning-*       → amarillo (alertas, alto uso de tarjeta)
  --color-info-*          → azul (inversiones, info)
```

**Dark mode:** Activado via `@variant dark (&:where(.dark, .dark *))` + clase `dark` fija en el `<html>` de layout.tsx.

---

### `app/layout.tsx` — Layout raíz

- Carga fuente Geist Sans como CSS variable `--font-geist-sans`
- Metadata: `title.default = "Financial Command Center"`, `title.template = "%s · FCC"`
- HTML con clase `dark h-full` → dark mode forzado + altura completa
- Body con `h-full antialiased`
- `lang="es"`

---

### `app/page.tsx` — Root redirect

```tsx
import { redirect } from "next/navigation";
export default function RootPage() { redirect("/dashboard"); }
```
Server-side redirect. En el futuro: punto de decisión auth → /login o /dashboard.

---

### `app/dashboard/page.tsx` — Placeholder activo

Página mínima que elimina el 404. Muestra texto "Financial Command Center — cargando...". Debe ser reemplazada por el dashboard real en el Paso 5.

---

### `types/finance.ts` — Contratos de datos

Tipos exportados:
- `Currency` = `"MXN" | "USD" | "EUR"`
- `Trend` = `"up" | "down" | "neutral"`
- `Account` { id, name, institution, type: AccountType, balance, currency, lastUpdated, color }
- `AccountType` = `"checking" | "savings" | "cash" | "investment"`
- `CreditCard` { id, name, institution, lastFourDigits, balance, limit, currency, cutoffDay, paymentDueDay, minimumPayment, color }
- `Transaction` { id, description, amount, type: TransactionType, category: TransactionCategory, date, accountId, currency, notes? }
- `TransactionType` = `"income" | "expense" | "transfer"`
- `TransactionCategory` = 11 categorías (salary, food, transport, entertainment, health, shopping, utilities, housing, education, travel, investment, transfer, other)
- `Investment` { id, name, ticker?, type: InvestmentType, quantity, purchasePrice, currentPrice, currency, institution }
- `InvestmentType` = `"stock" | "etf" | "crypto" | "fund" | "bond" | "real_estate"`
- `Goal` { id, name, category: GoalCategory, targetAmount, currentAmount, currency, targetDate, color, icon }
- `GoalCategory` = 8 categorías
- `NetWorthSummary` { totalAssets, totalLiabilities, netWorth, currency, trend, trendPercentage }
- `CashFlowSummary` { totalIncome, totalExpenses, netFlow, currency, period }

---

### `lib/mock-data/` — Datos de prueba

**accounts.ts** — 4 cuentas:
- BBVA Débito (checking): $28,450.75 MXN
- Nu Ahorro (savings): $52,300.00 MXN
- HSBC Nómina (checking): $12,800.50 MXN
- Efectivo (cash): $3,200.00 MXN

**cards.ts** — 3 tarjetas:
- Amex Gold: $8,650 / $40,000 (21.6% utilización)
- BBVA Azul: $3,200.50 / $15,000 (21.3%)
- Nu Card: $1,450 / $10,000 (14.5%)

**transactions.ts** — 10 transacciones del mes:
- Ingresos: Nómina $32,000 + Freelance $5,000 = $37,000
- Gastos: Renta, comida, transporte, entretenimiento, etc.
- 1 transferencia a Nu

**investments.ts** — 4 inversiones:
- VOO ETF: 5 unidades, compra $3,800 → actual $4,250 (+11.8%)
- AAPL: 10 acciones, compra $2,900 → actual $3,120 (+7.6%)
- BTC: 0.05 BTC, compra $900,000 → actual $1,050,000 (+16.7%)
- CETES: $10,000 → $10,112 (+1.1%)

**goals.ts** — 4 metas:
- 🛡️ Fondo emergencia: $52,300 / $100,000 (52.3%)
- ✈️ Viaje Japón: $18,500 / $60,000 (30.8%)
- 💻 MacBook Pro: $45,000 / $45,000 (100% — completada)
- 🏠 Enganche depa: $28,450 / $300,000 (9.5%)

**index.ts** — Barrel export: `import { mockAccounts, mockCards, ... } from "@/lib/mock-data"`

---

### `lib/formatters.ts` — Utilidades de presentación

- `formatCurrency(amount, currency)` → `"$28,450.75"` (usa Intl.NumberFormat es-MX)
- `formatPercent(value, decimals?)` → `"21.7%"`
- `formatDate(isoDate)` → `"27 may 2025"`
- `formatCompact(amount, currency)` → `"$52.3 K"`, `"$1.2 M"`

---

### `lib/calculations.ts` — Lógica de negocio (funciones puras)

- `calculateNetWorth(accounts, cards, investments)` → `NetWorthSummary`
- `calculateCashFlow(transactions)` → `CashFlowSummary` (filtra mes actual automáticamente)
- `calculateCardUtilization(card)` → `number` (0 a 1, ej: 0.216 = 21.6%)
- `calculateInvestmentGain(investment)` → `{ absoluteGain, percentageGain }`
- `calculateGoalProgress(currentAmount, targetAmount)` → `number` (0 a 1, capped a 1.0)

---

## Estado del servidor de desarrollo

El servidor corre con `npm run dev` en `C:\Cursor\Projects\FinancialCommandCenter\Financial Command Center`.

- `http://localhost:3000` → redirige a `/dashboard`
- `http://localhost:3000/dashboard` → muestra placeholder (sin 404)
- Todas las demás rutas → 404 (páginas pendientes)

---

## Próximos pasos en orden

### Paso 3 — Layout global (PRÓXIMO)
Crear en `components/layout/`:
1. `Sidebar.tsx` — Navegación lateral con links a todas las rutas, íconos, indicador de ruta activa
2. `TopBar.tsx` — Barra superior con título de la sección y acciones
3. `AppShell.tsx` — Wrapper que combina Sidebar + contenido principal

Luego actualizar `app/layout.tsx` para envolver todo con `AppShell`.

### Paso 4 — Componentes UI base
Crear en `components/ui/`:
- `Card.tsx` — Contenedor base para todas las cards
- `Badge.tsx` — Etiquetas de estado (positivo/negativo/warning)
- `ProgressBar.tsx` — Para metas y utilización de tarjetas
- `StatCard.tsx` — Card con número grande + label + tendencia

### Paso 5 — Dashboard page
Reemplazar el placeholder en `app/dashboard/page.tsx` con:
- `NetWorthCard` — Hero card con net worth total
- `CashFlowCard` — Ingresos vs gastos del mes
- `AccountsSummary` — Top 3-4 cuentas
- `RecentTransactions` — Últimas 5 transacciones
- `GoalsSummary` — Mini-vista de metas activas

### Pasos 6-7 — Páginas secundarias
Accounts, Cards, Investments, Transactions, Goals, Analytics (con Recharts).

---

## Convenciones de código establecidas

1. **Importaciones:** Usar alias `@/` siempre. Ej: `import { Account } from "@/types/finance"`
2. **Tipos:** Siempre importar desde `@/types/finance` — nunca definir tipos inline en componentes
3. **Datos:** Importar desde `@/lib/mock-data` (barrel) — nunca directo al archivo individual
4. **Dinero:** Siempre pasar por `formatCurrency()` — nunca `$${amount}` hardcodeado
5. **Clases CSS:** Usar tokens semánticos del design system (`bg-surface-card`, `text-text-secondary`) en lugar de grises genéricos de Tailwind
6. **Dark mode:** NO usar `dark:` en las clases — toda la app es dark por defecto. Los tokens ya son oscuros.
