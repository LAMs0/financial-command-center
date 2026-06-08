import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/*
  Cabeceras de seguridad HTTP — defensa en profundidad para una app financiera.
  Next.js NO las pone por defecto. Se aplican a todas las rutas.

  Qué hace cada una:
  - Strict-Transport-Security: fuerza HTTPS (el navegador rechaza HTTP futuro).
  - X-Frame-Options + frame-ancestors: anti-clickjacking (nadie puede meter la
    app en un <iframe> para robar clics/sesión).
  - X-Content-Type-Options: nosniff — el navegador respeta el Content-Type y no
    "adivina" (evita que un upload se interprete como script).
  - Referrer-Policy: no filtrar la URL completa a terceros.
  - Permissions-Policy: desactiva APIs del navegador que la app no usa.
  - object-src/base-uri: cierran vectores clásicos de inyección sin requerir
    nonces (no rompen los scripts inline de Next ni el themeScript anti-FOUC).

  Nota: un CSP estricto de script-src requeriría nonces por request (middleware)
  y puede romper el bootstrap inline de Next/Turbopack. Se deja como mejora futura;
  el riesgo de XSS aquí es bajo porque React escapa toda la salida y no se renderiza
  HTML controlado por el usuario.
*/
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig: NextConfig = {
  // Estos paquetes usan APIs nativas de Node (pdf.js + workers, canvas,
  // binarios de OCR/Excel). Si Next intenta empaquetarlos para el server
  // bundle, se rompen en runtime ("No se pudo leer el PDF"). Declararlos
  // como externos hace que se carguen con require() nativo.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "sharp", "xlsx"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

/*
  Envolvemos con Sentry SOLO si hay DSN (en producción/Vercel). Así en local sin
  DSN no se añade el plugin de build ni overhead. La subida de source maps requiere
  SENTRY_AUTH_TOKEN; si no está, Sentry la omite silenciosamente (silent:true).
*/
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
