"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Header light/dark switch. Toggles the `dark` class on <html> and persists the
 * choice to localStorage (read back by the no-flash init script in layout.tsx).
 * Dark is the default; this is the opt-in to light.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.theme = next ? "dark" : "light";
    } catch {}
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {/* Avoid an icon flash before we know the real theme on the client. */}
      {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
