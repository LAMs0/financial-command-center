import type { ReactNode } from "react";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export const metadata = {
  title: "Política de Privacidad · Privacy Policy",
  description: "Cómo Financial Command Center recopila, usa y protege tus datos.",
};

const UPDATED: Record<Locale, string> = {
  es: "5 de junio de 2026",
  en: "June 5, 2026",
};

function H({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 font-display text-xl font-bold uppercase tracking-tight text-text-primary">{children}</h2>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm leading-7 text-text-secondary">{children}</p>;
}

interface Section {
  h: string;
  body: ReactNode[];
}

interface LegalContent {
  title: string;
  updatedLabel: string;
  draft: ReactNode;
  sections: Section[];
}

const content: Record<Locale, LegalContent> = {
  es: {
    title: "Política de Privacidad",
    updatedLabel: "Última actualización",
    draft: (
      <>
        <strong>Borrador.</strong> Esta política es una plantilla de punto de partida y
        <strong> debe ser revisada por un abogado</strong> antes de un lanzamiento público,
        especialmente si se conectan instituciones financieras reales (Plaid/Belvo).
      </>
    ),
    sections: [
      {
        h: "1. Quiénes somos",
        body: [
          <>
            Financial Command Center (&quot;el Servicio&quot;) es una aplicación de finanzas
            personales que te permite organizar cuentas, tarjetas, transacciones, inversiones,
            metas y presupuestos en un solo lugar. Esta política explica qué datos tratamos y cómo.
          </>,
        ],
      },
      {
        h: "2. Datos que recopilamos",
        body: [
          <>
            <strong>Identidad (vía Google OAuth):</strong> tu nombre, correo y foto de perfil,
            únicamente para identificar tu espacio. Nunca recibimos ni almacenamos tu contraseña de Google.
          </>,
          <>
            <strong>Datos financieros que tú aportas:</strong> la información que importas
            (estados de cuenta en CSV/Excel/OFX/PDF/imagen) o capturas manualmente: cuentas,
            saldos, movimientos, tarjetas, inversiones y metas.
          </>,
          <>
            <strong>Datos de conexión bancaria (si la activas):</strong> al vincular una
            institución mediante un agregador, almacenamos un token de acceso <em>cifrado</em>
            {" "}(AES-256-GCM) — nunca en texto plano — para sincronizar tus cuentas y movimientos.
          </>,
        ],
      },
      {
        h: "3. Cómo usamos tus datos",
        body: [
          <>
            Usamos tus datos exclusivamente para prestarte el Servicio: mostrar tu panorama
            financiero, generar análisis y permitirte exportar reportes. No vendemos tus datos
            ni los compartimos con terceros para publicidad.
          </>,
        ],
      },
      {
        h: "4. Almacenamiento y seguridad",
        body: [
          <>
            Los datos se guardan en una base de datos PostgreSQL gestionada, con conexión cifrada
            (TLS). Cada usuario solo puede acceder a sus propios datos (aislamiento por cuenta).
            Los secretos sensibles se cifran en reposo. Aun así, ningún sistema es 100% infalible.
          </>,
        ],
      },
      {
        h: "5. Tus derechos",
        body: [
          <>
            Puedes ver, editar y borrar tus datos desde la app en cualquier momento, incluyendo la
            opción de <strong>eliminar tu cuenta</strong>, lo que borra de forma permanente tu perfil,
            tus credenciales OAuth y todos tus datos financieros asociados.
          </>,
        ],
      },
      {
        h: "6. Servicios de terceros",
        body: [
          <>
            El Servicio se apoya en proveedores como Google (autenticación) y, opcionalmente, un
            agregador bancario (p. ej. Plaid). El tratamiento de datos por parte de esos proveedores
            se rige por sus propias políticas de privacidad.
          </>,
        ],
      },
      {
        h: "7. Contacto",
        body: [
          <>
            Para ejercer tus derechos o consultas de privacidad, escribe a:{" "}
            <span className="text-brand-300">dg.luislo8@gmail.com</span>.
          </>,
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updatedLabel: "Last updated",
    draft: (
      <>
        <strong>Draft.</strong> This policy is a starting-point template and
        <strong> must be reviewed by a lawyer</strong> before a public launch,
        especially if real financial institutions are connected (Plaid/Belvo).
      </>
    ),
    sections: [
      {
        h: "1. Who we are",
        body: [
          <>
            Financial Command Center (&quot;the Service&quot;) is a personal finance application
            that lets you organize accounts, cards, transactions, investments, goals, and budgets
            in one place. This policy explains what data we process and how.
          </>,
        ],
      },
      {
        h: "2. Data we collect",
        body: [
          <>
            <strong>Identity (via Google OAuth):</strong> your name, email, and profile photo,
            solely to identify your space. We never receive or store your Google password.
          </>,
          <>
            <strong>Financial data you provide:</strong> the information you import
            (statements in CSV/Excel/OFX/PDF/image) or enter manually: accounts, balances,
            transactions, cards, investments, and goals.
          </>,
          <>
            <strong>Bank-connection data (if you enable it):</strong> when you link an
            institution through an aggregator, we store an <em>encrypted</em> access token
            {" "}(AES-256-GCM) — never in plain text — to sync your accounts and transactions.
          </>,
        ],
      },
      {
        h: "3. How we use your data",
        body: [
          <>
            We use your data exclusively to provide the Service: to show your financial picture,
            generate analytics, and let you export reports. We do not sell your data or share it
            with third parties for advertising.
          </>,
        ],
      },
      {
        h: "4. Storage and security",
        body: [
          <>
            Data is stored in a managed PostgreSQL database over an encrypted connection (TLS).
            Each user can only access their own data (per-account isolation). Sensitive secrets
            are encrypted at rest. Even so, no system is 100% infallible.
          </>,
        ],
      },
      {
        h: "5. Your rights",
        body: [
          <>
            You can view, edit, and delete your data from the app at any time, including the
            option to <strong>delete your account</strong>, which permanently removes your profile,
            your OAuth credentials, and all your associated financial data.
          </>,
        ],
      },
      {
        h: "6. Third-party services",
        body: [
          <>
            The Service relies on providers such as Google (authentication) and, optionally, a
            banking aggregator (e.g. Plaid). Data processing by those providers is governed by
            their own privacy policies.
          </>,
        ],
      },
      {
        h: "7. Contact",
        body: [
          <>
            To exercise your rights or for privacy questions, email:{" "}
            <span className="text-brand-300">dg.luislo8@gmail.com</span>.
          </>,
        ],
      },
    ],
  },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const c = content[locale];

  return (
    <article>
      <div className="mb-8 rounded-lg border border-warning-400/25 bg-warning-900/40 px-4 py-3 text-xs leading-5 text-warning-400">
        {c.draft}
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-300">Legal</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-text-primary sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-3 text-sm text-text-muted">{c.updatedLabel}: {UPDATED[locale]}</p>

      {c.sections.map((section) => (
        <section key={section.h}>
          <H>{section.h}</H>
          {section.body.map((paragraph, i) => (
            <P key={i}>{paragraph}</P>
          ))}
        </section>
      ))}
    </article>
  );
}
