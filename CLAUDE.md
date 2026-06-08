# Financial Command Center - Guia para agentes

Ultima actualizacion: 2026-06-07

Financial Command Center es una beta privada de centro financiero personal
premium: patrimonio, flujo de caja, cuentas, tarjetas, transacciones,
inversiones, metas, presupuesto, analytics, importacion/exportacion,
notificaciones y conectividad bancaria.

El usuario esta construyendo el producto camino a mercado. Prioriza cambios
practicos, verificados y consistentes con el design system. Explica el por que
cuando una decision tecnica o de producto sea importante.

## Stack

- Next.js 16.2.6, App Router, React 19.2.4, TypeScript 5
- Tailwind CSS v4 via `@theme` en `app/globals.css`
- Prisma 5.22 + PostgreSQL
- Auth.js v5 + Google OAuth + PrismaAdapter
- Recharts, Framer Motion, lucide-react
- Plaid SDK + `react-plaid-link`
- Vitest
- Importacion: CSV, XLSX (`@e965/xlsx`), OFX, PDF, imagen/OCR

## Comandos utiles

```bash
npm run dev
npm run build
npm run lint
npm test
npm audit
npx tsc --noEmit
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Validacion del 2026-06-07:

- `npx tsc --noEmit`: OK
- `npm run lint`: OK sin warnings
- `npm test`: OK, 55 tests
- `npm audit`: OK, 0 vulnerabilidades
- `npm run build`: OK

## Arquitectura

```text
app/
  page.tsx                    landing publica
  layout.tsx                  root layout, theme init, html lang
  (auth)/sign-in/             login/registro Google
  (legal)/privacy, terms      paginas legales bilingues
  (main)/                     rutas protegidas con sidebar/mobile nav
    dashboard/
    accounts/
    cards/
    transactions/
    investments/
    goals/
    budget/
    analytics/
    import/
components/
  ui/                         design system base
  layout/                     Sidebar, MobileNav, RouteTransition
  dashboard/                  DashboardStats, charts/listas de dashboard
  charts/                     Recharts
  import/                     StatementImporter
  onboarding/                 bienvenida, sample data, empty actions
  banking/                    ConnectBank, PlaidLinkButton
lib/
  data/                       repositorio de datos
  i18n/                       ES/EN liviano por cookie
  banking/                    mock provider + Plaid provider
  import/                     parsers, validacion y deteccion bancaria
  export/                     CSV/PDF
  crypto.ts                   AES-256-GCM para tokens sensibles
  logger.ts                   logging estructurado
prisma/
  schema.prisma
  migrations/
tests/unit/
```

## Capa de datos

Las paginas no deben importar Prisma ni mocks directamente. Usan `lib/data`:

- `getAccounts`
- `getCards`
- `getTransactions`
- `getInvestments`
- `getGoals`
- `getBudgets`
- `getMonthlyHistory`
- `getNotifications`
- `getOnboardingState`

`DATA_SOURCE`:

- `database`: lee Prisma/PostgreSQL
- `mock`: lee `lib/mock-data`

`withFallback()` cae a mocks si la query falla o si no se usa DB. Los props a
Client Components deben ser serializables: sin `Decimal`, sin `Date`, sin `Map`.

Usuario actual: `getCurrentUserId()` usa `auth()` y `session.user.id`; ya no hay
usuario demo hardcodeado.

## Auth y rutas protegidas

- `auth.config.ts`: config Edge-safe para proxy
- `auth.ts`: config completa con PrismaAdapter
- `proxy.ts`: protege rutas privadas y redirige a `/sign-in`
- Sesiones: JWT strategy
- La DB guarda usuarios y tokens OAuth (`Account`), no sesiones activas

## Prisma

Modelos principales:

- `User`
- `Account` OAuth
- `Session`
- `VerificationToken`
- `FinancialAccount`
- `CreditCard`
- `Transaction`
- `Investment`
- `Goal`
- `Budget`
- `BankConnection`

Convenciones:

- Dinero en `Decimal`, nunca `Float`
- `Account` es OAuth; cuenta bancaria es `FinancialAccount`
- Relaciones financieras usan `onDelete: Cascade`
- `BankConnection.accessTokenCipher` guarda tokens cifrados

## Design system

- Tokens en `app/globals.css` dentro de `@theme`
- Usar tokens semanticos:
  - superficies: `surface-*`
  - texto: `text-*`
  - marca: `brand-*`
  - semantica: `positive`, `negative`, `warning`, `info`
- Evitar clases genericas como `text-white` salvo casos muy puntuales.
- Usar `lucide-react` para iconos.
- Usar `lib/formatters.ts` para moneda, fechas, porcentajes y compactos.

## Multi-idioma

Sistema liviano ES/EN:

- `lib/i18n/config.ts`
- `lib/i18n/server.ts`
- `components/ui/LanguageToggle.tsx`

Mecanica:

- Cookie: `fcc-locale`
- Default: `es`
- `<html lang>` se calcula desde cookie
- El toggle actualiza cookie/localStorage y refresca la ruta

Superficies principales ya cubiertas: landing, sign-in, shell, dashboard,
accounts, cards, transactions, investments, goals, budget, analytics, import,
onboarding, legal, empty states, export menu, notifications, error/404/loading.

Pendiente: QA visual ES/EN en desktop y movil, mas barrido de strings residuales.

## Conectividad bancaria

`lib/banking` soporta:

- proveedor mock para beta/local
- proveedor Plaid real

Variables relevantes:

- `BANK_PROVIDER=mock | plaid`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV=sandbox | development | production`
- `APP_ENCRYPTION_KEY`

Pendiente: probar Plaid Sandbox end-to-end y configurar variables en produccion.

## Observabilidad y seguridad

- `lib/logger.ts` para logging estructurado
- `/api/client-error` para errores del cliente
- Rate limit con Upstash opcional y fallback en memoria
- `npm audit` limpio a 0 vulnerabilidades
- `@e965/xlsx` reemplaza al paquete `xlsx` vulnerable

Pendiente externo: rotar/deshabilitar secreto viejo de Google en Google Cloud
Console.

## Testing

Tests en `tests/unit`:

- banking mock
- calculations
- crypto
- formatters
- import validate

Tests de componentes en `tests/components`:

- ConnectBank
- DeleteCardButton

## Pendientes de mayor valor

1. Smoke test multi-idioma ES/EN:
   - `/`
   - `/sign-in`
   - `/dashboard`
   - `/import`
   - `/privacy`
   - mobile 390px
2. Normalizar encoding en `.env.example` y comentarios antiguos con mojibake.
3. Plaid Sandbox end-to-end.
4. Upstash en produccion.
5. Revision legal real de privacy/terms.

## Estado de producto

Beta privada: si.

Venta publica abierta: no todavia.

Bloqueos principales para venta publica:

- QA real con testers
- Plaid Sandbox/produccion probado
- revision legal
- monitoreo externo real configurado
- secretos rotados y entorno de produccion completo
