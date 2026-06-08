/*
  Inicialización de Sentry para el runtime Node.js (Server Components, API
  routes, server actions). Se carga desde instrumentation.ts.

  Gated por NEXT_PUBLIC_SENTRY_DSN: sin DSN, `enabled:false` → el SDK no envía
  nada (en local sigues viendo solo los logs de console). Solo error monitoring:
  tracing/replay desactivados para no consumir la cuota gratis.
*/
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});
