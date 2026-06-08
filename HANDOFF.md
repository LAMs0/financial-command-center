# HANDOFF — Financial Command Center

> Documento para retomar el proyecto sin perder contexto. Última actualización: **7 jun 2026**.

## TL;DR
Dashboard financiero personal (Next.js 16 + React 19 + TS + Prisma/Postgres Neon + Tailwind v4).
**Desplegado y funcionando en producción (Vercel)** con login Google operativo.
Fase 5 completa, i18n es/en completo, hardening pre-mercado hecho. **Plaid real implementado
y probado** en Sandbox (sync idempotente + re-sincronización); el proveedor `mock` sigue como
default. **Sentry** monitorea errores en server y cliente.

- **Prod:** https://financial-command-center-ochre.vercel.app  ← dominio estable
- **Repo:** github.com/LAMs0/financial-command-center (rama `main`)
- **Stack/arquitectura/convenciones:** ver `CLAUDE.md`
- **Camino a producción detallado:** ver `docs/PRODUCTION.md`

---

## Estado actual (qué funciona)
- ✅ Fases 1–4 (UI/design system, charts, Prisma+Neon, Auth.js v5 + Google OAuth).
- ✅ Fase 5: notificaciones, exportación CSV+PDF, importación multi-formato (CSV/Excel/OFX/PDF/imagen+OCR),
  onboarding + datos de ejemplo, conectividad bancaria (abstracción + **mock**), borrado de cuenta (GDPR),
  logger/monitoreo (`lib/logger`).
- ✅ Temática unificada (near-black/emerald, tokens + primitivos) + fondo animado.
- ✅ **i18n es/en COMPLETO** (incluye páginas legales). Infra en `lib/i18n` (`tx`/`getLocale`,
  cookie `fcc-locale`). Detalle en memoria del proyecto `project_i18n`.
- ✅ Tests: **Vitest, 55 tests** (`npm test`) sobre calculations, formatters, import/validate, banking, crypto y componentes críticos.
- ✅ Rate-limit async con **Upstash + fallback in-memory** (`lib/rate-limit.ts`).
- ✅ Cifrado **AES-256-GCM** (`lib/crypto.ts`) + modelo `BankConnection` en el schema.
- ✅ Páginas legales bilingües `/privacy` y `/terms` (marcadas BORRADOR; faltan revisión legal real + correos reales).
- ✅ **Deploy en Vercel (Hobby)**: `vercel-build` corre migraciones; `runtime=nodejs` + `maxDuration`
  en rutas pesadas; build verde.
- ✅ **Plaid real** (7 jun): `lib/banking/plaid-*`, server actions link/exchange/sync, access_token
  cifrado en `BankConnection`, **sync idempotente por `externalId`** + botón ↻ Re-sincronizar.
  Probado end-to-end en Sandbox. Switch `BANK_PROVIDER=mock|plaid`.
- ✅ **Borrado de tarjetas** con confirmación (`deleteCard` + `DeleteCardButton`).
- ✅ **Sentry** (7 jun): `@sentry/nextjs` (server/edge/client + instrumentation); `notifyMonitoring`
  y el error boundary reportan. Gated por `NEXT_PUBLIC_SENTRY_DSN` (no-op sin DSN).
- ✅ **Next 16**: `middleware.ts` migrado a `proxy.ts`. i18n vía `LocaleContext` (sin set-state-in-effect).
  Tests de componentes en `tests/components`. ESLint 0 warnings.

**Validación (7 jun):** `npx tsc --noEmit` limpio · `npm test` 55/55 · `eslint` 0 errores/0 warnings.
(El `build` lo corre Vercel; en local no se ejecuta para respetar la regla de un solo dev server.)

---

## ⚠️ Pendientes al retomar (en orden)

### 1. Variables de entorno en Vercel (Production) — lo más importante
El código de Plaid y Sentry ya está desplegado, pero **solo se activan si las vars existen** en
Vercel → Settings → Environment Variables (Production). Confirma/añade:
- `NEXT_PUBLIC_SENTRY_DSN` — sin ella Sentry NO reporta en prod (aunque el código esté).
- Para Plaid real en prod: `BANK_PROVIDER=plaid`, `PLAID_CLIENT_ID`, `PLAID_SECRET`,
  `PLAID_ENV=sandbox`, `APP_ENCRYPTION_KEY`. (Sin ellas, prod sigue en modo `mock`/DEMO, que
  funciona perfecto para demostrar la app.)
- Ya configuradas antes: `DATABASE_URL` (Neon), `AUTH_*`, `DATA_SOURCE=database`.
- Tras añadir vars, **Redeploy** para que se apliquen.
(El agente no puede pushear a `main`; los commits y el push los haces tú.)

### 2. Plaid — terminar el formulario de acceso (Sandbox gratis)
Quedaban **3 adjuntos** por subir en el "Security Questionnaire":
- **Q4** (MFA consumidores): screenshot de `/sign-in` (login con Google) + 2FA de Google activado.
- **Q5** (MFA sistemas críticos): screenshot de 2FA activado en GitHub/Vercel/Neon.
- **Q11** (retención de datos): subir el PDF de la **Data Retention & Disposal Policy**
  (texto ya redactado en el chat / se puede versionar como `docs/DATA_RETENTION_POLICY.md`).
- Respuestas clave ya decididas: industria = *Budgeting and financial management tools*;
  producto = **Transactions**; plan = **Pay As You Go**; no se venden datos; sin breaches.
- Consent screen en **Testing** → agregar Test Users (o publicar) para que entren cuentas de prueba.

### 3. Plaid — integración REAL ✅ IMPLEMENTADA (6 jun 2026)
Implementado y validado (tsc + 55 tests + lint). Falta solo **probarlo end-to-end** con keys
en `.env` y, para producción, poner las vars en Vercel.
- Deps instaladas: `plaid` 42.x + `react-plaid-link` 4.x.
- `lib/banking/plaid-client.ts` — cliente SDK (singleton, lee `PLAID_*`).
- `lib/banking/plaid-provider.ts` — `createLinkToken` / `exchangePublicToken` / `syncByAccessToken`
  + mapeo Plaid→tipos de dominio (cuentas, categorías PFC, signo→income/expense).
- `lib/actions/banking.ts` — `createPlaidLinkToken` + `connectPlaidItem` (cifra access_token →
  `BankConnection` → sync → persiste). Helper `persistSyncResult` compartido con el mock.
- `components/banking/PlaidLinkButton.tsx` + `ConnectBank` ramifica por `provider.mode`
  (`"link"` = widget Plaid · `"direct"` = botones del mock).
- Migración `BankConnection` **ya aplicada** (`20260606160927_add_bank_connection`).
- **Para probar:** en `.env` poner `BANK_PROVIDER="plaid"`, `PLAID_CLIENT_ID`, `PLAID_SECRET`,
  `PLAID_ENV="sandbox"`, `APP_ENCRYPTION_KEY` (gen: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
  Reiniciar dev → /accounts → "Conectar un banco" → elegir banco sandbox → `user_good` / `pass_good`.
- **Para Vercel:** añadir esas 5 vars en Settings → Environment Variables (Production) y redeploy.
- ✅ Probado end-to-end en Sandbox (6 jun 2026): conecta, sincroniza cuentas + transacciones,
  cifra el access_token. Recordatorio: Sandbox NO conecta bancos reales (eso es Production,
  requiere aprobación del formulario de Plaid).

### 3b. Sync incremental idempotente por `externalId` ✅ HECHO (7 jun 2026)
`persistSyncResult` (lib/actions/banking.ts) ahora es **idempotente**:
- Columnas `externalId` en `FinancialAccount` y `Transaction` (+ `@@unique([userId, externalId])`;
  NULL para cuentas/movimientos manuales — los NULL no colisionan en Postgres).
  Migración `20260607120000_add_external_id_sync` aplicada.
- Cuentas: `upsert` por `(userId, externalId)` → actualiza balance/nombre, agrega nuevas, no
  duplica. `color`/`institution` se fijan solo al crear (estables entre syncs).
- Transacciones: `createMany({ skipDuplicates: true })` → omite las ya importadas.
- **Botón "Re-sincronizar"** (icono ↻) en cada institución conectada en modo link
  (`ConnectBank`) → server action `resyncInstitution` (descifra el access_token de
  `BankConnection`, re-sync, actualiza `lastSyncedAt`).
- Futuro opcional: webhooks de Plaid (`SYNC_UPDATES_AVAILABLE`) para auto-refrescar sin botón;
  guardar el `cursor` de `transactionsSync` para sync verdaderamente incremental (hoy re-lee todo
  y deduplica, que es correcto pero menos eficiente).

### 3c. Borrado de tarjetas (hecho 6 jun 2026)
- `lib/actions/cards.ts` → `deleteCard(cardId)` (scoped a `userId`).
- `components/cards/DeleteCardButton.tsx` → confirmación de 2 pasos + advertencia, bilingüe,
  insertado por tarjeta en `/cards`. Borra el registro local `CreditCard` (las tarjetas NO
  vienen del sync de Plaid; ese flujo solo crea FinancialAccount + Transaction).

### 4. Limpieza menor
- ✅ Correos legales reales (`dg.luislo8@gmail.com`) en `/privacy` y `/terms` (7 jun).
- ✅ Docs de Railway/Docker marcados obsoletos: `DEPLOY.md` ahora es un stub que apunta a
  `docs/PRODUCTION.md`; `Dockerfile` etiquetado como alternativa no usada (Vercel es el canónico).
- ✅ Rate-limit: avisa en logs (`rate_limit.upstash_not_configured`) si corre en producción
  sin Upstash — el gap queda visible hasta configurar `UPSTASH_REDIS_REST_*` en Vercel.
- ✅ Secreto viejo de Google deshabilitado (confirmar que `AUTH_GOOGLE_SECRET` en Vercel es el habilitado).
- (Opcional) Activar **Dependabot/CodeQL** en GitHub para respaldar las respuestas de seguridad de Plaid.
- (Opcional prod a escala) `DATABASE_URL` con **pooler** de Neon + `directUrl` para migraciones.
- Revisión **legal real** de `/privacy` y `/terms` antes de un lanzamiento público serio (siguen marcados borrador).

---

## Notas operativas / gotchas
- **Un solo `next dev` por proyecto.** Next 16 comparte `.next`; no levantar un 2º dev server ni
  correr `next build` con un dev activo (corrompe `.next` → pantalla negra). Ver memoria `feedback-no-second-dev-server`.
- **Dominios Vercel:** usa siempre el estable `...-ochre.vercel.app`. El de hash (`...-o0q2nlhhb-...`) y
  los `-git-main`/`-lam-s-projects9` cambian o están protegidos por Deployment Protection (401).
- **Google OAuth redirect URI** registrada: `https://financial-command-center-ochre.vercel.app/api/auth/callback/google`.
  Hay 2 client secrets en Google; `AUTH_GOOGLE_SECRET` en Vercel debe ser el **habilitado**.
- **maxDuration=60** en `/api/import/statement` (límite del plan Hobby). En Pro se puede subir a 300, o
  mover el OCR al cliente.
- **`DATA_SOURCE`**: `database` (prod) | `mock` (sin DB). **`BANK_PROVIDER`**: `mock` (default) | `plaid`.
- `.env` está en `.gitignore`; nunca commitear secrets. Plantilla en `.env.example`.

## Comandos
```bash
npm run dev          # desarrollo (NO levantar un 2º)
npm run build        # build prod (solo sin dev activo)
npm test             # Vitest (55 tests)
npx tsc --noEmit     # type-check rápido sin tocar .next
npm run db:migrate   # generar/aplicar migración (genera la de BankConnection cuando toque Plaid)
```

## Mapa rápido del código
- `lib/banking/` — abstracción `BankProvider` (`types.ts`, `mock-provider.ts`, `plaid-provider.ts` stub, `index.ts`)
- `lib/actions/banking.ts` — connect/disconnect (persisten en FinancialAccount/Transaction)
- `components/banking/ConnectBank.tsx` — UI conectar/desconectar en `/accounts`
- `lib/crypto.ts` — AES-256-GCM (token de Plaid)
- `lib/rate-limit.ts` — async, Upstash + fallback
- `lib/i18n/` — `config.ts` (diccionario + `tx`), `server.ts` (`getLocale`); `components/ui/LanguageToggle.tsx`
- `lib/data/index.ts` — capa de datos (switch `DATA_SOURCE`, `getCurrentUserId`)
- `app/(legal)/` — privacy/terms bilingües · `app/(main)/` — páginas internas · `app/(auth)/sign-in`
- `docs/PRODUCTION.md` — Plaid Sandbox + checklist Vercel · `CLAUDE.md` — guía completa del proyecto
