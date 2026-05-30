"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("fcc-theme") as Theme | null;
      const preferred: Theme =
        stored === "light" || stored === "dark"
          ? stored
          : window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";

      setTheme(preferred);
      applyTheme(preferred);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("fcc-theme", next);
  }

  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-text-secondary transition hover:bg-white/[0.08] hover:text-white active:bg-white/[0.1]"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
    </button>
  );
}
