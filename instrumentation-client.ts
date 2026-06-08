/*
  Inicialización de Sentry en el navegador (Next 15.3+ / 16 usa este archivo en
  vez de sentry.client.config). Captura errores no controlados del cliente.
  Gated por NEXT_PUBLIC_SENTRY_DSN. Replay/tracing desactivados (cuota gratis).
*/
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// Instrumenta las transiciones de navegación del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
