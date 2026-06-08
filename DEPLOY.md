# Despliegue — Financial Command Center

> ⚠️ **Esta guía quedó obsoleta.** El despliegue real y soportado es **Vercel**.
> La app ya está en producción en Vercel (Hobby) con `maxDuration=60` en las rutas
> de OCR, login Google operativo y migraciones automáticas vía `vercel-build`.

## Guía vigente
👉 **`docs/PRODUCTION.md`** — checklist de Vercel, variables de entorno, Plaid y notas serverless.

## Alternativa en contenedor (opcional, no usada)
El `Dockerfile` de la raíz sigue disponible por si algún día se prefiere un contenedor
de larga ejecución (Railway/Render) para evitar el límite de `maxDuration` del plan Hobby
en OCR de PDFs grandes. **No es el camino por defecto** y no recibe mantenimiento activo.
Si se retoma, el script `start:prod` (`prisma migrate deploy && next start`) es el entrypoint.
