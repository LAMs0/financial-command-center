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
import { useLocale } from "@/contexts/LocaleContext";
import { tx, type Locale } from "@/lib/i18n/config";

interface NotificationCenterProps {
  notifications: AppNotification[];
  panelAlign?: "left" | "right";
}

export default function NotificationCenter({
  notifications,
  panelAlign = "right",
}: NotificationCenterProps) {
  const locale = useLocale();
  const t = (text: string) => tx(locale, text);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

    // Detección de idioma en cliente desde <html lang> (intencional).
  function markAllAsRead() {
    if (notifications.length === 0) return;
    setReadIds((current) => {
      const next = new Set(current);
      for (const notification of notifications) {
        next.add(notification.id);
      }
      return next;
    });
  }

  function toggleOpen() {
    setOpen((value) => {
      const next = !value;
      if (next) markAllAsRead();
      return next;
    });
  }

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

  const unreadNotifications = notifications.filter((n) => !readIds.has(n.id));
  const criticalCount = unreadNotifications.filter((n) => n.severity === "critical").length;
  const unreadCount = unreadNotifications.length;
  const totalCount = notifications.length;
  const panelPosition = panelAlign === "left" ? "left-0" : "right-0";

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label={`${t("Notificaciones")}${unreadCount > 0 ? ` - ${unreadCount} ${t("sin leer")}` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative grid h-9 w-9 place-items-center rounded-lg border text-text-secondary transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 ${
          unreadCount > 0
            ? "border-brand-400/40 bg-brand-500/15 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
            : "border-white/10 bg-white/[0.03]"
        }`}
        onClick={toggleOpen}
        type="button"
      >
        <Bell aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-text-primary ${
              criticalCount > 0 ? "bg-negative-500" : "bg-warning-500"
            }`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          aria-label={t("Notificaciones")}
          className={`absolute ${panelPosition} top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl shadow-black/40`}
          role="dialog"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">{t("Notificaciones")}</p>
              <p className="text-xs text-text-muted">
                {totalCount === 0
                  ? t("Todo en orden")
                  : unreadCount > 0
                    ? `${unreadCount} ${unreadCount !== 1 ? t("alertas") : t("alerta")}`
                    : t("Todo esta al dia")}
              </p>
            </div>
            <button
              aria-label={t("Cerrar notificaciones")}
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
                  {t("Todo esta al dia")}
                </p>
                <p className="text-xs text-text-muted">
                  {t("No hay alertas financieras por ahora.")}
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
                          {severityLabel(n.severity, locale)}
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

function severityLabel(severity: NotificationSeverity, locale: Locale): string {
  if (severity === "critical") return tx(locale, "Critica");
  if (severity === "warning") return tx(locale, "Advertencia");
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
