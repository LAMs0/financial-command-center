"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CreditCard,
  Flag,
  Info,
  Landmark,
  PiggyBank,
  X,
} from "lucide-react";
import type {
  AppNotification,
  NotificationCategory,
  NotificationSeverity,
} from "@/types/finance";

interface NotificationCenterProps {
  notifications: AppNotification[];
  panelAlign?: "left" | "right";
}

export default function NotificationCenter({
  notifications,
  panelAlign = "right",
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const criticalCount = notifications.filter((n) => n.severity === "critical").length;
  const badgeCount = notifications.length;
  const panelPosition = panelAlign === "left" ? "left-0" : "right-0";

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label={`Notificaciones${badgeCount > 0 ? ` - ${badgeCount} sin leer` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-text-secondary transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Bell aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />

        {badgeCount > 0 && (
          <span
            aria-hidden="true"
            className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-text-primary ${
              criticalCount > 0 ? "bg-negative-500" : "bg-warning-500"
            }`}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          aria-label="Notificaciones"
          className={`absolute ${panelPosition} top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl shadow-black/40`}
          role="dialog"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Notificaciones</p>
              <p className="text-xs text-text-muted">
                {badgeCount === 0
                  ? "Todo en orden"
                  : `${badgeCount} alerta${badgeCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              aria-label="Cerrar notificaciones"
              className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(420px,70vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Bell
                    aria-hidden="true"
                    className="h-5 w-5 text-text-muted"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-medium text-text-primary">
                  Todo esta al dia
                </p>
                <p className="text-xs text-text-muted">
                  No hay alertas financieras por ahora.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      className="flex gap-3 px-4 py-3.5 transition hover:bg-white/[0.04]"
                      href={n.href}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        aria-hidden="true"
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${severityBg(n.severity)}`}
                      >
                        <CategoryIcon category={n.category} severity={n.severity} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${severityText(n.severity)}`}>
                          {severityLabel(n.severity)}
                        </p>
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                          {n.message}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function severityBg(severity: NotificationSeverity): string {
  if (severity === "critical") return "bg-negative-900 text-negative-400";
  if (severity === "warning") return "bg-warning-900 text-warning-400";
  return "bg-info-900 text-info-400";
}

function severityText(severity: NotificationSeverity): string {
  if (severity === "critical") return "text-negative-400";
  if (severity === "warning") return "text-warning-400";
  return "text-info-400";
}

function severityLabel(severity: NotificationSeverity): string {
  if (severity === "critical") return "Critica";
  if (severity === "warning") return "Advertencia";
  return "Info";
}

function CategoryIcon({
  category,
  severity,
}: {
  category: NotificationCategory;
  severity: NotificationSeverity;
}) {
  const cls = `h-3.5 w-3.5 ${severityText(severity)}`;

  if (category === "budget") {
    return <PiggyBank aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }
  if (category === "card") {
    return <CreditCard aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }
  if (category === "goal") {
    return <Flag aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }
  if (category === "account") {
    return <Landmark aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }
  if (severity === "critical") {
    return <AlertCircle aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }
  if (severity === "warning") {
    return <AlertTriangle aria-hidden="true" className={cls} strokeWidth={1.8} />;
  }

  return <Info aria-hidden="true" className={cls} strokeWidth={1.8} />;
}
