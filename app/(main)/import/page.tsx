import { SectionHeader } from "@/components/ui";
import StatementImporter from "@/components/import/StatementImporter";
import { Badge } from "@/components/ui";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Importar estado de cuenta" };

export default async function ImportPage() {
  const locale = await getLocale();
  const t = (text: string) => tx(locale, text);

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow={t("Importar")}
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-info-400 bg-clip-text text-transparent"
        title={t("Importar estado de cuenta")}
        actions={<Badge label="CSV & OFX" tone="info" size="md" />}
      />
      <div className="px-4 py-6 md:px-8">
        <StatementImporter locale={locale} />
      </div>
    </section>
  );
}
