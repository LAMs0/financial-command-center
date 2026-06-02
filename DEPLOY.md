# Despliegue a producción — Financial Command Center

Guía paso a paso para publicar la app. Recomendación de hosting: **Railway**
(contenedor de larga ejecución). Al final hay notas para Vercel.

> ⚠️ **Por qué Railway y no Vercel.** La importación usa OCR pesado
> (`tesseract.js` + `sharp` + ~19 MB de modelos en `tessdata/`). En funciones
> serverless (Vercel) ese trabajo puede exceder el timeout (10 s en Hobby) y los
> límites de tamaño del bundle. Un contenedor de larga ejecución (Railway/Render)
> no tiene esos límites: el OCR corre cómodo y `prisma migrate deploy` se ejecuta
> de forma natural al arrancar. El `Dockerfile` ya está listo para esto.

---

## 0. Antes de nada: ROTAR LOS SECRETOS 🔐

Tu `.env` local contiene credenciales reales que ya estuvieron en texto plano.
Antes de exponer la app públicamente, **regénralas** (las viejas se consideran
comprometidas):

1. **`AUTH_SECRET`** — genera uno nuevo:
   ```bash
   npx auth secret
   ```
2. **`AUTH_GOOGLE_SECRET`** — en Google Cloud Console → *APIs & Services →
   Credentials* → tu OAuth Client → **"Reset secret"**. Copia el nuevo.
3. **Contraseña de Neon (`DATABASE_URL`)** — en el dashboard de Neon → *Roles* →
   resetea la contraseña de `neondb_owner` y actualiza la connection string.

Nunca pongas estos valores en git: `.env*` ya está en `.gitignore`.

---

## 1. Subir el repo a GitHub

Aún no es un repositorio git. Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Financial Command Center — listo para deploy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/financial-command-center.git
git push -u origin main
```

Verifica que `.env` **NO** aparezca en el commit (`git status` antes de comitear).

---

## 2. Crear el proyecto en Railway

1. Entra a [railway.app](https://railway.app) y crea cuenta (login con GitHub).
2. **New Project → Deploy from GitHub repo →** selecciona tu repo.
3. Railway detecta el `Dockerfile` automáticamente y empieza a construir.

---

## 3. Base de datos

Tienes dos opciones:

- **A) Seguir usando Neon (más simple):** solo pega tu `DATABASE_URL` de Neon en
  las variables de Railway (paso 4). No agregues Postgres en Railway.
- **B) Postgres de Railway:** *New → Database → PostgreSQL*. Railway expone
  `DATABASE_URL` que puedes referenciar con `${{ Postgres.DATABASE_URL }}`.

Las migraciones se aplican solas en el arranque (`start:prod` corre
`prisma migrate deploy`).

---

## 4. Variables de entorno (Railway → Service → Variables)

```
DATA_SOURCE=database
DATABASE_URL=<tu connection string>
AUTH_SECRET=<el nuevo secret>
AUTH_GOOGLE_ID=<tu client id>
AUTH_GOOGLE_SECRET=<el nuevo secret de Google>
```

No necesitas `AUTH_URL`: `trustHost: true` ya detecta el dominio. (Si algo falla
con los callbacks, fíjalo a tu dominio público.)

---

## 5. Dominio

1. En Railway → Service → **Settings → Networking → Generate Domain** para obtener
   un `*.up.railway.app` (sirve para probar).
2. Para dominio propio: **Custom Domain →** escribe tu dominio y agrega el registro
   CNAME que Railway indique en tu proveedor de DNS.

---

## 6. Google OAuth — autorizar el dominio de producción

En Google Cloud Console → *APIs & Services → Credentials → tu OAuth Client*:

- **Authorized JavaScript origins:**
  `https://tu-dominio.com`
- **Authorized redirect URIs:**
  `https://tu-dominio.com/api/auth/callback/google`

(Conserva también los de `http://localhost:3000` para desarrollo.)

Además, en la **OAuth consent screen**, si quieres que cualquier cuenta Google
pueda entrar (no solo testers), publica la app (*Publishing status → In production*).
Mientras esté en "Testing", solo los correos en la lista de test users podrán entrar.

---

## 7. Verificar

1. Abre `https://tu-dominio.com` → debe redirigir a `/sign-in`.
2. "Continue with Google" → primer login crea tu usuario automáticamente.
3. Como usuario nuevo verás la **pantalla de bienvenida**: importa un extracto o
   carga datos de ejemplo.
4. Importa un PDF/imagen para confirmar que el OCR funciona en el contenedor.

---

## Alternativa: Vercel

Funciona para todo MENOS el OCR pesado de forma fiable. Si aun así quieres Vercel:

1. Importa el repo en vercel.com.
2. Variables de entorno: las mismas del paso 4.
3. Build command por defecto (`next build`); el `postinstall` corre `prisma generate`.
4. Migraciones: Vercel no corre `start:prod`. Aplica migraciones aparte
   (`npx prisma migrate deploy` desde tu máquina apuntando a la DB de prod, o un
   step de CI).
5. OCR: sube el plan a Pro para timeouts de 60 s, o mueve el OCR a un worker/servicio
   aparte. Importar CSV/Excel/OFX seguirá siendo rápido; PDF escaneado/imagen es lo
   que sufre.
```
