import type { ReactNode } from "react";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export const metadata = {
  title: "Términos de Servicio · Terms of Service",
  description: "Condiciones de uso de Financial Command Center.",
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

const privacyLink = (label: string) => (
  <a className="text-brand-300 underline-offset-2 hover:underline" href="/privacy">
    {label}
  </a>
);

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
    title: "Términos de Servicio",
    updatedLabel: "Última actualización",
    draft: (
      <>
        <strong>Borrador.</strong> Estos términos son una plantilla de punto de partida y
        <strong> deben ser revisados por un abogado</strong> antes de un lanzamiento público.
      </>
    ),
    sections: [
      {
        h: "1. Aceptación",
        body: [
          <>
            Al crear una cuenta o usar Financial Command Center (&quot;el Servicio&quot;) aceptas
            estos Términos. Si no estás de acuerdo, no uses el Servicio.
          </>,
        ],
      },
      {
        h: "2. Naturaleza del Servicio (Beta)",
        body: [
          <>
            El Servicio se ofrece en fase <strong>beta</strong> y puede cambiar, interrumpirse o
            contener errores. Es una herramienta de <strong>organización financiera personal</strong>;
            no es un banco, asesor financiero, contador ni casa de bolsa.
          </>,
        ],
      },
      {
        h: "3. No es asesoría financiera",
        body: [
          <>
            La información, cálculos y análisis que muestra el Servicio son de carácter informativo
            y <strong>no constituyen asesoría financiera, fiscal ni de inversión</strong>. Las
            decisiones que tomes con base en ellos son tu responsabilidad.
          </>,
        ],
      },
      {
        h: "4. Tu cuenta y uso aceptable",
        body: [
          <>
            Eres responsable de la actividad en tu cuenta y de la veracidad de los datos que ingresas.
            Te comprometes a no abusar del Servicio, intentar vulnerar su seguridad, ni acceder a datos
            que no te pertenezcan.
          </>,
        ],
      },
      {
        h: "5. Tus datos",
        body: [
          <>
            Conservas la propiedad de tus datos. El tratamiento de los mismos se rige por nuestra{" "}
            {privacyLink("Política de Privacidad")}. Puedes exportar o eliminar tus datos en cualquier momento.
          </>,
        ],
      },
      {
        h: "6. Limitación de responsabilidad",
        body: [
          <>
            El Servicio se proporciona &quot;tal cual&quot;, sin garantías de ningún tipo. En la
            máxima medida permitida por la ley, no seremos responsables por daños indirectos,
            pérdida de datos o perjuicios derivados del uso o la imposibilidad de uso del Servicio.
          </>,
        ],
      },
      {
        h: "7. Cambios",
        body: [
          <>
            Podemos actualizar estos Términos. Si los cambios son materiales, lo notificaremos por
            medios razonables. El uso continuado tras los cambios implica su aceptación.
          </>,
        ],
      },
      {
        h: "8. Contacto",
        body: [
          <>
            Dudas sobre estos Términos:{" "}
            <span className="text-brand-300">dg.luislo8@gmail.com</span>.
          </>,
        ],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updatedLabel: "Last updated",
    draft: (
      <>
        <strong>Draft.</strong> These terms are a starting-point template and
        <strong> must be reviewed by a lawyer</strong> before a public launch.
      </>
    ),
    sections: [
      {
        h: "1. Acceptance",
        body: [
          <>
            By creating an account or using Financial Command Center (&quot;the Service&quot;) you
            accept these Terms. If you do not agree, do not use the Service.
          </>,
        ],
      },
      {
        h: "2. Nature of the Service (Beta)",
        body: [
          <>
            The Service is offered in <strong>beta</strong> and may change, be interrupted, or
            contain errors. It is a <strong>personal financial organization</strong> tool; it is
            not a bank, financial advisor, accountant, or brokerage.
          </>,
        ],
      },
      {
        h: "3. Not financial advice",
        body: [
          <>
            The information, calculations, and analytics shown by the Service are informational and
            <strong> do not constitute financial, tax, or investment advice</strong>. Decisions you
            make based on them are your responsibility.
          </>,
        ],
      },
      {
        h: "4. Your account and acceptable use",
        body: [
          <>
            You are responsible for the activity in your account and the accuracy of the data you
            enter. You agree not to abuse the Service, attempt to breach its security, or access
            data that does not belong to you.
          </>,
        ],
      },
      {
        h: "5. Your data",
        body: [
          <>
            You retain ownership of your data. Its processing is governed by our{" "}
            {privacyLink("Privacy Policy")}. You can export or delete your data at any time.
          </>,
        ],
      },
      {
        h: "6. Limitation of liability",
        body: [
          <>
            The Service is provided &quot;as is&quot;, without warranties of any kind. To the
            maximum extent permitted by law, we will not be liable for indirect damages, data loss,
            or harm arising from the use of, or inability to use, the Service.
          </>,
        ],
      },
      {
        h: "7. Changes",
        body: [
          <>
            We may update these Terms. If the changes are material, we will notify you by reasonable
            means. Continued use after the changes implies acceptance.
          </>,
        ],
      },
      {
        h: "8. Contact",
        body: [
          <>
            Questions about these Terms:{" "}
            <span className="text-brand-300">dg.luislo8@gmail.com</span>.
          </>,
        ],
      },
    ],
  },
};

export default async function TermsPage() {
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
