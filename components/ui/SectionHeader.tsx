import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  eyebrowClassName?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  actions,
  eyebrowClassName = "text-brand-300",
}: SectionHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className={`text-xs uppercase tracking-[0.24em] ${eyebrowClassName}`}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-text-primary md:text-3xl">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}
