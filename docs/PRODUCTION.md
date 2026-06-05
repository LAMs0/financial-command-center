# Camino a producción — pendientes

Estado: la app está funcionalmente completa (Fase 5) y validada (tsc + 51 tests + lint).
Quedan **dos frentes pendientes** antes de salir a producción.

---

## 1) Conexión con Plaid (Sandbox gratis) — probar el flujo dentro de la web

La fundación ya está lista: abstracción `BankProvider` (`lib/banking`), `lib/crypto.ts`
(AES-256-GCM) y el modelo `BankConnection` en el schema. Falta **implementar el adaptador
real** detrás de `BANK_PROVIDER=plaid`. El entorno **Sandbox de Plaid es gratis** (datos
ficticios) y sirve para probar el flujo completo conectar → sincronizar → desconectar.

### Pasos
1. Crear cuenta en https://dashboard.plaid.com (gratis). Tomar `client_id` y el `secret`
   de **Sandbox**.
2. Instalar el SDK: `npm i plaid` y `npm i react-plaid-link` (componente de UI).
3. `.env` (ya están en `.env.example`):
   ```
   BANK_PROVIDER=plaid
   PLAID_CLIENT_ID=...
   PLAID_SECRET=...
   PLAID_ENV=sandbox
   APP_ENCRYPTION_KEY=...   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Correr la migración del modelo nuevo: `npm run db:migrate` (crea la tabla `BankConnection`).
5. Implementar `lib/banking/plaid-provider.ts` siguiendo el flujo real de Plaid (hoy es un
   stub documentado):
   - **Server action** `createLinkToken()` → `plaidClient.linkTokenCreate(...)`.
   - **Cliente**: `<PlaidLink>` con ese `link_token` → devuelve `public_token`.
   - **Server action** `exchangePublicToken(public_token)` →
     `plaidClient.itemPublicTokenExchange(...)` → cifrar el `access_token` con
     `encryptSecret()` y guardarlo en `BankConnection`.
   - **Sync**: `plaidClient.accountsGet` + `plaidClient.transactionsSync` → mapear a
     `ProviderAccount[]` / `ProviderTransaction[]` (las mismas formas que ya consume
     `lib/actions/banking.ts`).
6. La UI (`components/banking/ConnectBank.tsx`) y las server actions ya existen; el único
   cambio es que el botón "Conectar" abra el Plaid Link en vez de llamar al mock directo.

> En Sandbox usa credenciales de prueba (ej. usuario `user_good` / `pass_good`) para simular
> bancos reales (Chase, Wells Fargo, BoA) sin costo.

---

## 2) Despliegue en producción — Vercel

Vercel es el host canónico de Next.js (mejor encaje que el `Dockerfile`/Railway actuales,
que pueden quedar como alternativa). **Pero es serverless**, y eso tiene 3 implicaciones
que esta app debe atender:

### A. Rate limiting → **requiere Upstash** (ya soportado)
En serverless el limitador en memoria se resetea por invocación. `lib/rate-limit.ts` ya
cae a Upstash Redis si defines las vars. **Obligatorio en Vercel:**
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
(Crear una base gratis en https://upstash.com → Redis → copiar REST URL + token.)

### B. OCR de importación → **timeout de funciones** ⚠️
La importación de PDF/imagen usa `tesseract.js` + `pdf-parse`, que pueden tardar decenas de
segundos. Límite de duración de función en Vercel: **Hobby 60s, Pro hasta 300s** (vía
`export const maxDuration` en la route). Opciones:
- Añadir `export const maxDuration = 60;` (o 300 en Pro) en `app/api/import/statement/route.ts`.
- Mejor a futuro: mover el OCR al **cliente** (tesseract.js corre en el browser) para no
  depender del timeout del server.
- `serverExternalPackages` ya declara `tesseract.js`, `pdf-parse`, `sharp`, `xlsx` (bien),
  pero ojo con el **tamaño del bundle** de la función (límite ~250 MB descomprimido en Vercel).
  Si el deploy falla por tamaño, el OCR client-side resuelve esto también.

### C. Base de datos → connection pooling
Serverless abre muchas conexiones cortas. Con Neon usa la **connection string con pooler**
(`-pooler` en el host) para `DATABASE_URL`, o el adaptador serverless de Neon.

### Checklist de despliegue en Vercel
1. Importar el repo en Vercel (Framework: Next.js, root = `Financial Command Center`).
2. Variables de entorno (Production):
   - `DATABASE_URL` (Neon, **con pooler**)
   - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - `DATA_SOURCE=database`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `APP_ENCRYPTION_KEY`
   - (si Plaid) `BANK_PROVIDER`, `PLAID_*`
3. Google OAuth: añadir el redirect URI de producción en Google Cloud Console:
   `https://TU-DOMINIO.vercel.app/api/auth/callback/google` (y el dominio custom si lo hay).
   `trustHost: true` ya está, así que Auth.js detecta el host automáticamente.
4. Migraciones: correr `prisma migrate deploy` contra la DB de prod (incluye `BankConnection`).
   Se puede automatizar con un build/deploy hook o ejecutándolo una vez manualmente.
5. `maxDuration` en la route de import (ver punto B).
6. Smoke test: login Google, dashboard, importar, exportar, conectar banco (sandbox), es/en.

### Otros pendientes ya conocidos (no bloqueantes)
- Revisión **legal real** del contenido de `/privacy` y `/terms` (hoy marcado BORRADOR) y
  actualizar los correos `your-domain.com` / `tu-dominio.com`.
- `npm run build` final (correrlo sin un `next dev` activo: Next permite un solo dev server
  por proyecto y comparten `.next`).
