# ── Financial Command Center — imagen de producción (ALTERNATIVA, no usada) ───
# NOTA: el despliegue real y soportado es Vercel (ver docs/PRODUCTION.md).
# Este Dockerfile queda como opción de contenedor de larga ejecución
# (Railway/Render) por si se necesita evitar el límite de maxDuration del plan
# Hobby en OCR de PDFs grandes. No recibe mantenimiento activo.
# Maneja bien el OCR pesado (tesseract.js + sharp) sin límites de timeout/tamaño.
# Imagen única (no standalone) para evitar problemas de tracing con las
# dependencias nativas (sharp, pdf-parse).

FROM node:20-bookworm-slim

WORKDIR /app

# Variables de build. NODE_ENV se fija en producción.
ENV NODE_ENV=production
# Next telemetría off.
ENV NEXT_TELEMETRY_DISABLED=1

# 1) Copiamos manifiestos + schema ANTES de instalar.
#    El postinstall corre `prisma generate`, que necesita prisma/schema.prisma.
COPY package.json package-lock.json ./
COPY prisma ./prisma

# 2) Instalamos TODAS las deps (incluidas dev: necesitamos el CLI de prisma para
#    `migrate deploy` en el arranque, y las toolchains para `next build`).
#    --include=dev fuerza devDependencies aunque NODE_ENV=production.
RUN npm ci --include=dev

# 3) Copiamos el resto del código (incluye tessdata/ con los modelos OCR).
COPY . .

# 4) Build de Next (valida tipos/SSR y genera .next).
RUN npm run build

EXPOSE 3000

# 5) En el arranque: aplica migraciones pendientes y levanta el server.
#    Next respeta la variable PORT que Railway/Render inyectan.
CMD ["npm", "run", "start:prod"]
