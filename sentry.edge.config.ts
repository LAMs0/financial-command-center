/*
  Inicialización de Sentry para el Edge Runtime (middleware y rutas edge).
  Se carga desde instrumentation.ts. Gated por NEXT_PUBLIC_SENTRY_DSN.
*/
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});
