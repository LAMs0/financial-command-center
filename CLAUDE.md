# Financial Command Center — Guía para Claude Code

Dashboard financiero personal premium (estilo herramienta de analytics profesional,
NO un tracker de gastos básico): net worth, cash flow, cuentas, deudas, tarjetas,
inversiones, metas y analytics. El usuario está aprendiendo desarrollo profesional
con Next.js — explica el "por qué" de cada decisión, no solo el "cómo".

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2.4** + **TypeScript 5**
- **Tailwind CSS v4** — configurado vía `@theme` en `app/globals.css`, **NO** hay `tailwind.config.ts`
- **Prisma 5.22** + **PostgreSQL (Neon)**
- **Recharts** (gráficas), **Framer Motion** (animaciones), **lucide-react** (iconos)
- Aún SIN autenticación (NextAuth planeado para Fase 4)

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # build de producción (validación real de tipos/SSR)
npm run lint         # ESLint
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # prisma db seed  (tsx prisma/seed.ts)
npm run db:studio    # prisma studio
```

## Arquitectura

```
app/
  (main)/            # route group con sidebar — el paréntesis NO aparece en la URL
    layout.tsx       # Server Component async: MonthProvider + Sidebar + MobileNav
    dashboard/  accounts/  cards/  transactions/  investments/  goals/  budget/  analytics/
    styleguide/      # inventario visual del design system
    loading.tsx  error.tsx  not-found.tsx
  layout.tsx  page.tsx  globals.css
components/
  ui/                # design system: Card, Badge, Button, ProgressBar, StatCard,
                     # SectionHeader, AnimateIn, EmptyState, Skeleton, ThemeToggle, MonthSelector
  charts/            # NetWorthChart, CashFlowChart, PortfolioAllocationChart (Recharts)
  dashboard/         # DashboardStats, SpendingDonutChart, TransactionsList (Client Components)
  layout/            # Sidebar (+MobileNav), RouteTransition
contexts/MonthContext.tsx   # Context API para el mes seleccionado (Client)
lib/
  data/              # ⭐ Capa de acceso a datos (ver abajo)
  mock-data/         # datos mock + tipos derivados (Budget, MonthlySnapshot)
  calculations.ts    # net worth, utilización de tarjeta, progreso de metas, allocation
  formatters.ts      # formatCurrency, formatPercent, formatDate, formatCompact
  prisma.ts          # cliente Prisma singleton (patrón globalThis para HMR)
types/finance.ts     # ⭐ TODOS los tipos de dominio viven aquí
prisma/              # schema.prisma, seed.ts, migrations/
```

## Capa de datos (lib/data) — clave del proyecto

Las páginas **nunca** importan mocks ni Prisma directamente. Importan funciones del
repositorio: `getAccounts, getCards, getTransactions, getInvestments, getGoals,
getBudgets, getMonthlyHistory`. Todas son `async`.

- **Switch por entorno** `DATA_SOURCE` en `.env`:
  - `mock` → lee `lib/mock-data` (no necesita DB)
  - `database` → lee de Prisma/PostgreSQL (estado actual)
- **Fallback seguro**: `withFallback()` cae a los mocks si la query falla o si
  `DATA_SOURCE !== "database"`, para que la pantalla nunca quede en blanco.
- **Serialización** (`lib/data/serialize.ts`): convierte `Prisma.Decimal → number`
  (`toNumber`) y `Date → "YYYY-MM-DD"` (`toISODate`). Crítico: pasar un `Decimal`
  a un Client Component rompe la serialización de React.
- **Usuario actual**: `getCurrentUserId()` resuelve el usuario demo por email
  (`demo@financialcc.app`). Cuando entre NextAuth, este es el ÚNICO punto a cambiar.
- `getMonthlyHistory()` siempre devuelve mock (aún no hay tabla de snapshots).

Patrón de página (Server Component async):
```tsx
export default async function FooPage() {
  const [accounts, cards] = await Promise.all([getAccounts(), getCards()]);
  // cálculos derivados aquí, luego render
}
```

## Modelo de datos (Prisma)

Modelos: `User`, `Account` (OAuth — nombre que exige el adapter de NextAuth),
`Session`, `VerificationToken`, `FinancialAccount` (cuenta bancaria/efectivo),
`CreditCard`, `Transaction`, `Investment`, `Goal`, `Budget`.

Convenciones críticas:
- **Dinero = `Decimal`**, nunca `Float` (precisión). `@db.Decimal(14,2)` para montos;
  `(18,8)` para `quantity`; `(18,4)` para precios de inversión.
- **`Account` ≠ cuenta bancaria**: `Account` es OAuth (NextAuth). La cuenta bancaria
  es `FinancialAccount`. No confundir.
- `seed.ts` replica `lib/mock-data` **1:1** (mismos colores, fechas, montos).
- `prisma` (CLI) en `devDependencies`; `@prisma/client` en `dependencies`.

## Sistema de diseño

- Tokens en `app/globals.css` dentro de `@theme {}` (Tailwind v4). Ej: `--color-brand-500`
  → utilidades `bg-brand-500`, `text-brand-500`, etc.
- Dark mode por clase `.dark` en `<html>` (`@variant dark`).
- Paleta: superficies `surface-base/card/raised/border`; marca emerald `brand-*`;
  semántica `positive/negative/warning/info`; texto `text-primary/secondary/muted`.
- Usar `lib/formatters.ts` para TODO formato de moneda/fecha/porcentaje.

## Convenciones

- Tipos de dominio SIEMPRE desde `types/finance.ts`. Si cambias una forma de dato,
  cámbiala ahí y deja que TypeScript marque lo que se rompe.
- Páginas = Server Components async (sin `"use client"`). Interactividad (filtros,
  estado de mes) en Client Components dedicados (`components/dashboard/*`, contexts).
- Props a Client Components deben ser serializables (sin `Map`, sin `Decimal`, sin `Date`).
- Comentarios y nombres de UI en español/inglés según el patrón existente del archivo.

## Estado actual

- ✅ Fase 1: fundación visual (layout, design system, páginas, mock data)
- ✅ Fase 2: charts Recharts, página budget con semáforo, MonthContext
- ✅ Fase 3: Prisma + PostgreSQL (Neon), capa `lib/data`, todas las páginas migradas
  a leer de la DB (`DATA_SOURCE=database`), seed 1:1 con mocks
- ✅ Fase 4: autenticación con Auth.js v5 + Google OAuth + PrismaAdapter
- ⬜ Fase 5: por definir (mejoras UX, notificaciones, exportación, etc.)

## Autenticación (Fase 4)

- **`auth.config.ts`** — config Edge-safe (sin Prisma); usada por el middleware
- **`auth.ts`** — config completa (PrismaAdapter + JWT strategy); usada en Server Components
- **`middleware.ts`** — protege todas las rutas; redirige sin sesión a `/sign-in`
- **`app/(auth)/sign-in/`** — página de login con diseño split-screen (sin sidebar)
- **`app/api/auth/[...nextauth]/route.ts`** — handler HTTP de Auth.js

Patrón crítico — **config dividida** (obligatorio para Next.js + Prisma):
- Middleware = Edge Runtime → solo puede usar `authConfig` (sin imports de Node.js)
- Server Components / API routes = Node.js → usan `auth` de `auth.ts` (con PrismaAdapter)

Sesiones = **JWT strategy** (no database sessions). La DB guarda tokens OAuth (`Account`)
y usuarios (`User`), pero las sesiones activas son cookies JWT — no hay tabla `Session` en uso.

`getCurrentUserId()` en `lib/data/index.ts`:
- Lee `session.user.id` del JWT via `auth()` — no hace query a la DB
- Sigue envuelto en `React.cache()` para deduplicar dentro de un render pass

Variables de entorno requeridas:
```
AUTH_SECRET="..."          # genera con: npx auth secret
AUTH_GOOGLE_ID="..."       # de Google Cloud Console
AUTH_GOOGLE_SECRET="..."   # de Google Cloud Console
```

Para producción, añadir a los Authorized redirect URIs de Google:
`https://tu-dominio.com/api/auth/callback/google`

## Limpieza de código (pre-Fase 5)

Antes de la Fase 4 se realizó un sweep completo de calidad:

**Nuevos archivos de utilidad:**
- `lib/constants.ts` — `DEMO_USER_EMAIL` (fuente única de verdad)
- `components/charts/_chartUtils.tsx` — tipos de tooltip y `ActiveMonthTick` compartidos

**Nuevas funciones en `lib/formatters.ts`:**
- `formatAccountType(type)` — elimina duplicados en dashboard/accounts
- `transactionTone(type)` — clase CSS de color por tipo de transacción
- `transactionPrefix(type)` — prefijo +/- por tipo

**Nuevas funciones en `lib/calculations.ts`:**
- `calculateAggregateCardUtilization(cards)` — utilización total de tarjetas
- `calculatePortfolioSummary(investments)` — resumen del portafolio en un solo pass
- `calculateBudgetRatio(budget)` — ratio spent/allocated
- ~~`calculateCashFlow`~~ — eliminado (dead code, nunca fue llamado)

**`lib/data/index.ts`:**
- `getCurrentUserId()` → antes: lookup por email demo; ahora: `auth()` session
- Envuelto en `React.cache()` para deduplicar queries por render pass
- `getBudgets()` default month ahora es dinámico (`new Date()...`) en vez de `"2025-05"`

**`types/finance.ts`:**
- `AllocationDatum` movido aquí desde `lib/calculations.ts`

## Gotchas / pendientes

- `.env` está en `.gitignore` — contiene connection string de Neon y secrets de OAuth.
  **Nunca** commitear secrets.
- `app/_dashboard_old/` **eliminado** en la sesión de limpieza.
- UI/UX la lleva un agente de diseño aparte. Pendientes clave:
  - Loading states: `Skeleton`/`SkeletonCard`/`SkeletonListRow` existen en `components/ui`
    pero ningún `loading.tsx` los usa todavía
  - Sweep de `text-white` → `text-text-primary` para modo claro
  - `tabular-nums` falta en analytics, goals, cards y transactions
  - Focus rings consistentes en filtros y MonthSelector
- Props a Client Components deben ser serializables (sin `Map`, sin `Decimal`, sin `Date`).
- Comentarios y nombres de UI en español/inglés según el patrón existente del archivo.
