# Financial Command Center

Dashboard financiero personal para importar estados de cuenta, monitorear patrimonio, flujo de caja, tarjetas, inversiones, metas y presupuesto desde un espacio privado por usuario.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 con tokens en `app/globals.css`
- Auth.js v5 con Google OAuth y Prisma Adapter
- Prisma + PostgreSQL
- Recharts, Framer Motion y lucide-react

## Setup Local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` con las variables necesarias:

```bash
DATABASE_URL="postgresql://..."
DATA_SOURCE="database"
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Opcional: Redis compartido para rate limit en produccion
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Opcional: webhook para errores estructurados
ERROR_WEBHOOK_URL=""
```

3. Genera Prisma y aplica migraciones:

```bash
npm run db:generate
npm run db:migrate
```

4. Levanta desarrollo:

```bash
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # servidor local
npm run build        # build de produccion
npm run start        # servir build
npm run start:prod   # prisma migrate deploy + next start
npm run lint         # ESLint
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:seed      # datos demo
npm run db:studio    # Prisma Studio
npm audit            # auditoria de dependencias
```

## Flujo De Producto

- `/` es la landing publica.
- `/sign-in` crea o abre el espacio privado con Google OAuth.
- `/dashboard` muestra onboarding si el usuario no tiene datos.
- `/import` procesa CSV, OFX, Excel, PDF e imagenes del estado de cuenta.
- Las rutas principales usan skeleton loading states reales mediante `PageLoading`.

## Datos Y Privacidad

Cada usuario tiene datos aislados por `userId`. El schema usa `onDelete: Cascade`, por lo que borrar un `User` elimina:

- cuentas OAuth (`Account`)
- sesiones (`Session`)
- cuentas financieras
- tarjetas
- transacciones
- inversiones
- metas
- presupuestos

La UI incluye una accion de dos pasos para "Eliminar cuenta", pensada para el requerimiento GDPR de borrar datos del usuario.

## Monitoreo Y Logging

La app incluye logging estructurado en `lib/logger.ts`.

- Los logs salen como JSON en stdout/stderr.
- Errores de cliente se reportan a `POST /api/client-error`.
- Si `ERROR_WEBHOOK_URL` existe, los errores tambien se envian a ese webhook.

Esto permite operar localmente sin proveedor externo y conectar Sentry, Datadog, Axiom o un webhook propio despues sin rehacer los puntos de captura.

## Seguridad Beta

Checklist antes de invitar testers:

- Deshabilitar o rotar el secreto viejo de Google OAuth en Google Cloud Console.
- Confirmar que solo los redirect URIs correctos estan autorizados.
- Correr `npm audit` y revisar vulnerabilidades.
- Confirmar que `.env` no se commitea.
- Usar `AUTH_SECRET` fuerte generado con `npx auth secret`.
- Configurar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en produccion para rate limit compartido.

## Idioma

La UI de beta apunta a espanol. Si agregas nuevas superficies visibles, evita mezclar labels en ingles como `Cash flow`, `Net worth` o `Import Statement`.

## Deploy

1. Configura variables de entorno en el host.
2. Asegura que la DB tenga migraciones aplicadas:

```bash
npm run start:prod
```

3. En Google Cloud Console agrega el callback de produccion:

```text
https://tu-dominio.com/api/auth/callback/google
```
