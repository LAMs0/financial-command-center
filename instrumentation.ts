/*
  Hook de instrumentación de Next.js. Carga la config de Sentry según el runtime
  y registra el captador de errores de request (App Router).
*/
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura errores lanzados dentro de Server Components / route handlers.
export const onRequestError = Sentry.captureRequestError;
