# Reglas de seguridad — Financial Command Center

Invariantes específicos de este proyecto. El plugin `security-guidance` los inyecta
en cada revisión de diff. Son reglas que el modelo no puede inferir solo.

## Autorización y aislamiento de datos (prevención de IDOR)

- **Toda** query de Prisma que lea o escriba datos financieros (`financialAccount`,
  `creditCard`, `transaction`, `investment`, `goal`, `budget`) DEBE filtrarse por el
  `userId` del usuario autenticado, obtenido de `auth()` / `getCurrentUserId()`.
  **Nunca** uses un id de usuario o de recurso que venga de la request (params, body,
  query string) para decidir qué datos devolver o mutar.
- La capa `lib/data/*` es la ÚNICA vía sancionada para LEER datos financieros.
  No consultes Prisma directamente desde páginas o componentes.
- Si un endpoint recibe el `id` de un recurso del cliente para actualizar/borrar,
  la query DEBE incluir además `userId` en el `where` (ej. `where: { id, userId }`),
  para que un usuario no pueda tocar recursos de otro.

## Autenticación

- Todo nuevo Route Handler (`app/api/**`) y toda Server Action que toque datos DEBE
  llamar a `auth()` y rechazar (401 / early return) si no hay `session.user`.
  Excepción única: `/api/auth/*` (flujo OAuth).
- No debilites el callback `authorized` de `auth.config.ts` ni el `matcher` del
  middleware para exponer rutas protegidas.

## Secretos

- Secretos SOLO por variables de entorno: `DATABASE_URL`, `AUTH_SECRET`,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Nunca hardcodeados en el código.
- `.env` debe permanecer en `.gitignore`. Solo se versiona `.env.example` (sin valores).
- Nunca hagas `console.log`/responses que incluyan el objeto `session` completo,
  tokens OAuth, el connection string o cualquier secreto.

## Entrada no confiable (subida de archivos / parsers)

- `/api/import/statement` DEBE conservar el límite de tamaño (`MAX_FILE_SIZE`) y el
  allowlist de extensiones/MIME. No subas ese límite sin razón.
- NUNCA escribas el contenido subido a disco usando un nombre/ruta provisto por el
  cliente (`file.name`) — riesgo de path traversal. Hoy todo se procesa en memoria;
  mantenlo así.
- No pases datos parseados del extracto a `eval`, `new Function`, ni a un template
  que se renderice como HTML sin escapar.
- Al añadir regex que procesen texto subido (CSV/OFX/PDF), evita patrones con
  backtracking catastrófico (ReDoS): nada de `(.+)+`, `(\d+)*`, alternancias anidadas.

## Base de datos

- Usa siempre la API parametrizada de Prisma. Prohibido `$queryRawUnsafe` /
  `$executeRawUnsafe` con interpolación de entrada del usuario. Si necesitas SQL
  crudo, usa `$queryRaw` con tagged template (parámetros), nunca concatenación.
- El dinero es `Decimal` en el schema; no lo conviertas a `Float`.

## Cabeceras / transporte

- No elimines las cabeceras de seguridad de `next.config.ts` (`headers()`):
  HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy.
- `trustHost: true` está bien para Railway/Vercel; si se mueve a otro host detrás de
  un proxy no confiable, fija `AUTH_URL` explícito.
