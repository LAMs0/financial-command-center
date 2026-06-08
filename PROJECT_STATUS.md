# Financial Command Center - Estado del proyecto

Ultima actualizacion: 2026-06-07

Este documento reemplaza el resumen historico inicial. El proyecto ya no esta en
fase de scaffold: es una beta privada funcional con autenticacion, datos reales,
importacion, exportacion, onboarding, conectividad bancaria mock/Plaid y soporte
multi-idioma inicial.

## Veredicto actual

Financial Command Center esta en estado de **beta privada valida para testers**.
No esta listo todavia para venta publica abierta, pero ya puede probarse con
usuarios controlados si se configuran correctamente OAuth, base de datos,
variables de entorno y proveedor bancario.

## Validacion tecnica del 2026-06-07

Comandos ejecutados:

- `npx tsc --noEmit`: OK
- `npm run lint`: OK sin warnings
- `npm test`: OK, 7 archivos y 55 tests pasan
- `npm audit`: OK, 0 vulnerabilidades
- `npm run build`: OK

Warnings actuales:

- No hay warnings actuales de ESLint.
- La proteccion de rutas ya usa la convencion `proxy.ts` de Next 16.

## Stack vigente

- Next.js 16.2.6, App Router, Turbopack build
- React 19.2.4
- TypeScript 5
- Tailwind CSS v4 via `@theme` en `app/globals.css`
- Prisma 5.22 con PostgreSQL
- Auth.js v5 + Google OAuth + PrismaAdapter
- Recharts para graficas
- Framer Motion para animaciones
- lucide-react para iconografia
- Vitest para pruebas unitarias
- Plaid SDK + `react-plaid-link`
- OCR/importacion con `pdf-parse`, `tesseract.js` y `@e965/xlsx`

## Rutas principales

Publicas:

- `/`: landing page publica
- `/sign-in`: login/registro con Google
- `/privacy`: politica de privacidad
- `/terms`: terminos de uso

Protegidas:

- `/dashboard`
- `/accounts`
- `/cards`
- `/transactions`
- `/investments`
- `/goals`
- `/budget`
- `/analytics`
- `/import`
- `/styleguide`

API:

- `/api/auth/[...nextauth]`
- `/api/import/statement`
- `/api/export/transactions`
- `/api/export/report`
- `/api/client-error`

## Capacidades implementadas

### Producto y UI

- Landing page publica alineada visualmente con la beta.
- Sign-in con panel premium y Google OAuth.
- App shell con `Sidebar`, `MobileNav`, notificaciones, theme toggle y language
  toggle.
- Modo claro/oscuro funcional mediante `fcc-theme`.
- Soporte multi-idioma inicial ES/EN mediante cookie `fcc-locale`.
- Loading states con skeletons/PageLoading en las rutas principales.
- Empty states para usuarios nuevos y datos faltantes.
- Onboarding de bienvenida para usuario sin datos.
- Banner de datos de ejemplo con confirmacion antes de limpiar.
- Error/404 on-brand con CTA.
- Responsive basico validado anteriormente en landing/sign-in.

### Datos y dominio financiero

- Capa `lib/data` como repositorio central.
- `DATA_SOURCE=database` para Prisma/PostgreSQL.
- Fallback a mock data si la DB falla o se usa `DATA_SOURCE=mock`.
- Serializacion de `Decimal` y `Date` antes de pasar props a Client Components.
- Modelos Prisma:
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
- Cascadas `onDelete: Cascade` para borrado total de cuenta y datos financieros.

### Auth, multiusuario y privacidad

- Auth.js v5 con Google OAuth.
- Middleware protege rutas privadas.
- Usuario actual resuelto por `auth()` desde JWT.
- Datos aislados por `userId`.
- Borrado de cuenta desde sidebar/mobile nav con confirmacion.
- Paginas legales bilingues en `/privacy` y `/terms`.
- Variables sensibles documentadas en `.env.example`.
- `APP_ENCRYPTION_KEY` para cifrar tokens de proveedor bancario.

### Importacion/exportacion

- Importador de estados de cuenta en `/import`.
- Formatos soportados:
  - CSV
  - Excel/XLSX via `@e965/xlsx`
  - OFX
  - PDF
  - imagenes con OCR
- Deteccion de banco y validacion de parseo.
- Warnings/errores visibles antes de guardar.
- Export CSV por dataset.
- Export PDF de reporte mensual.

### Conectividad bancaria

- Abstraccion `lib/banking`.
- Proveedor mock para beta local.
- Plaid implementado:
  - creacion de link token
  - exchange de public token
  - sync de cuentas/transacciones
  - access token cifrado en `BankConnection`
- `BankProvider.mode` soporta modo directo/mock y link/Plaid.

### Observabilidad y seguridad

- Logger estructurado en `lib/logger.ts`.
- Endpoint `/api/client-error` para errores del cliente.
- Integracion de logging en importacion, exportacion, onboarding, banking,
  rate-limit y errores principales.
- Rate limit con Upstash Redis opcional y fallback en memoria.
- `npm audit` limpio a 0 vulnerabilidades.
- `xlsx` vulnerable reemplazado por `@e965/xlsx`.
- `postcss` fijado con override.

### Testing

Tests activos en `tests/unit` y `tests/components`:

- `banking-mock.test.ts`
- `calculations.test.ts`
- `ConnectBank.test.tsx`
- `crypto.test.ts`
- `DeleteCardButton.test.tsx`
- `formatters.test.ts`
- `import-validate.test.ts`

Resultado actual: 55 tests pasan.

## Multi-idioma

Estado: implementado en forma inicial y build-safe.

Archivos clave:

- `lib/i18n/config.ts`
- `lib/i18n/server.ts`
- `components/ui/LanguageToggle.tsx`

Mecanica:

- Idiomas soportados: `es`, `en`
- Idioma por defecto: `es`
- Cookie: `fcc-locale`
- `<html lang>` se calcula desde cookie en `app/layout.tsx`
- El toggle actualiza cookie/localStorage y refresca la ruta.

Superficies cubiertas:

- Landing
- Sign-in
- Sidebar/MobileNav
- Dashboard
- Accounts
- Cards
- Transactions
- Investments
- Goals
- Budget
- Analytics
- Import
- Onboarding
- Empty states compartidos
- Export menu
- Notification center
- Error/404/loading states
- Legal pages

Pendiente de QA:

- Barrido visual EN/ES con navegador en desktop y movil.
- Buscar strings residuales hardcodeados.
- Confirmar que labels largos en ingles no rompan botones, badges ni mobile nav.
- Decidir si se mantiene este sistema liviano o se migra a un i18n framework
  formal cuando haya mas idiomas/rutas localizadas.

## Pendientes prioritarios para la siguiente sesion

1. Smoke test de multi-idioma en navegador:
   - `/`
   - `/sign-in`
   - `/dashboard`
   - `/import`
   - `/privacy`
   - movil 390px
2. Normalizar encoding en documentos heredados (`CLAUDE.md`, `.env.example` y
   comentarios antiguos con mojibake).
3. Probar Plaid Sandbox end-to-end con:
   - `BANK_PROVIDER=plaid`
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV=sandbox`
   - `APP_ENCRYPTION_KEY`
4. Configurar Upstash en produccion.
5. Revision legal real de privacy/terms antes de public launch.
6. Revisar rotacion/deshabilitacion del secreto viejo de Google en Google Cloud
   Console.

## Riesgos abiertos

- La app es apta para beta privada, no para venta publica abierta.
- El contenido legal es borrador tecnico, no revision legal formal.
- Plaid real esta implementado, pero requiere prueba Sandbox y variables en
  entorno real.
- El sistema i18n actual es intencionalmente liviano; funciona para ES/EN, pero
  no resuelve rutas localizadas ni traducciones parametrizadas complejas.
- Hay documentacion heredada con encoding roto que puede confundir a futuros
  agentes si no se limpia.

## Criterio para beta

Beta privada aceptable si:

- Google OAuth funciona en el dominio configurado.
- La DB de produccion tiene migraciones aplicadas.
- `APP_ENCRYPTION_KEY` esta definido si se usa Plaid.
- Upstash esta configurado o se acepta rate-limit en memoria para una instancia.
- Se hace smoke test ES/EN antes de invitar testers.
