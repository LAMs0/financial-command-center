import type { ReactNode } from "react";

/*
  Card — contenedor base reutilizable.

  ¿Por qué un componente Card en lugar de clases directas?
  Si mañana decides cambiar el radio o el borde de todas las cards,
  lo cambias en UN solo lugar. Sin este componente, tendrías que
  buscar y reemplazar en cada página.

  Variants:
  - "default"  → card estándar (bg-surface-card)
  - "raised"   → ligeramente más clara, para cards dentro de cards
  - "ghost"    → sin fondo, solo borde sutil
*/

type CardVariant = "default" | "raised" | "ghost";

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-card border border-white/10",
  raised:  "bg-surface-raised border border-white/10",
  ghost:   "bg-transparent border border-white/10",
};

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  /** Añade padding interno estándar (default: true) */
  padded?: boolean;
}

export default function Card({
  children,
  variant = "default",
  className = "",
  padded = true,
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl shadow-2xl shadow-black/20",
        variantClasses[variant],
        padded ? "p-5" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/*
  CardHeader — sección superior de una card con título y subtítulo.
  Separada con un borde inferior opcional.
*/
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;   // slot para botón o badge a la derecha
  bordered?: boolean;
}

export function CardHeader({
  title,
  subtitle,
  action,
  bordered = true,
}: CardHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between px-5 py-4",
        bordered ? "border-b border-white/10" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
