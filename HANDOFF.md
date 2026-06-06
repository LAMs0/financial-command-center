# HANDOFF — Financial Command Center

> Documento para retomar el proyecto sin perder contexto. Última actualización: **5 jun 2026**.

## TL;DR
Dashboard financiero personal (Next.js 16 + React 19 + TS + Prisma/Postgres Neon + Tailwind v4).
**Desplegado y funcionando en producción (Vercel)** con login Google operativo.
Fase 5 completa, i18n es/en completo, hardening pre-mercado hecho. Lo único pendiente de
features es la **integración real de Plaid** (hoy hay un proveedor mock funcional).

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
- ✅ Tests: **Vitest, 51 tests** (`npm test`) sobre calculations, formatters, import/validate, banking, crypto.
- ✅ Rate-limit async con **Upstash + fallback in-memory** (`lib/rate-limit.ts`).
- ✅ Cifrado **AES-256-GCM** (`lib/crypto.ts`) + modelo `BankConnection` en el schema.
- ✅ Páginas legales bilingües `/privacy` y `/terms` (marcadas BORRADOR; faltan revisión legal real + correos reales).
- ✅ **Deploy en Vercel (Hobby)**: `vercel-build` corre migraciones; `runtime=nodejs` + `maxDuration`
  en rutas pesadas; build verde.

**Validación:** `npx tsc --noEmit` limpio · `npm test` 51/51 · `npm run build` OK · `eslint` 0 errores.

---

## ⚠️ Pendientes al retomar (en orden)

### 1. Git — pushear commits locales
Hay **2 commits locales sin subir** (prep de Vercel). Desde la raíz del repo:
```bash
git push origin main
```
(El agente no puede pushear a `main`; lo haces tú.)

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
Implementado y validado (tsc + 51 tests + lint). Falta solo **probarlo end-to-end** con keys
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

### 3b. Mejora futura — sync incremental por `externalId` (NO bloqueante)
Hoy `persistSyncResult` (lib/actions/banking.ts) deduplica **por nombre de cuenta** dentro de
una institución: al reconectar un banco agrega solo las cuentas nuevas (p. ej. una savings que
no se compartió la primera vez) sin duplicar las existentes ni sus transacciones. Limitación:
no permite **re-sincronizar** (actualizar balances / traer movimientos nuevos) y los nombres
deben ser distintos. La versión robusta:
- Añadir columna `externalId` (provider account_id) a `FinancialAccount` y a `Transaction`
  (+ índices únicos por usuario) y migrar.
- Cambiar el guardado a `upsert` por `externalId` → idempotente: actualiza balances, agrega
  cuentas/transacciones nuevas, no duplica. Habilitaría un botón "Re-sincronizar".

### 3c. Borrado de tarjetas (hecho 6 jun 2026)
- `lib/actions/cards.ts` → `deleteCard(cardId)` (scoped a `userId`).
- `components/cards/DeleteCardButton.tsx` → confirmación de 2 pasos + advertencia, bilingüe,
  insertado por tarjeta en `/cards`. Borra el registro local `CreditCard` (las tarjetas NO
  vienen del sync de Plaid; ese flujo solo crea FinancialAccount + Transaction).

### 4. Limpieza menor
- Reemplazar correos placeholder `your-domain.com` / `tu-dominio.com` en `app/(legal)/privacy` y `terms`
  por el correo real (`dg.luislo8@gmail.com` o dominio propio).
- (Opcional) Activar **Dependabot/CodeQL** en GitHub para respaldar las respuestas de seguridad de Plaid.
- (Opcional prod a escala) `DATABASE_URL` con **pooler** de Neon + `directUrl` para migraciones; Upstash en prod.
- Revisión **legal real** de `/privacy` y `/terms` antes de un lanzamiento público serio.

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
npm test             # Vitest (51 tests)
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
