import type { ReactNode } from "react";
import Card from "./Card";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-5 py-14 text-center">
      <Card className="max-w-md shadow-none" variant="raised">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-300">
          {icon}
        </div>
        <h2 className="mt-4 text-base font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {description}
        </p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </Card>
    </div>
  );
}
