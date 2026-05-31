import { SectionHeader } from "@/components/ui";
import StatementImporter from "@/components/import/StatementImporter";
import { Badge } from "@/components/ui";

export const metadata = { title: "Import Statement" };

export default function ImportPage() {
  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Connect"
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-info-400 bg-clip-text text-transparent"
        title="Import Bank Statement"
        actions={<Badge label="CSV & OFX" tone="info" size="md" />}
      />
      <div className="px-4 py-6 md:px-8">
        <StatementImporter />
      </div>
    </section>
  );
}
