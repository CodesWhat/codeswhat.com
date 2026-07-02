"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

/**
 * Sonner toasts themed to follow the `.dark` class on <html> (set by the header
 * toggle and the no-flash script in layout.tsx) rather than the OS
 * prefers-color-scheme. Without this, a light-OS user with dark selected (the
 * app default) would get light-themed toasts over a dark shell.
 */
export function ThemedToaster() {
  // default dark to match the app's dark-by-default shell (avoids a flash)
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="bottom-right"
      theme={dark ? "dark" : "light"}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          backdropFilter: "blur(8px)",
        },
        className:
          "!bg-white dark:!bg-neutral-900 !text-neutral-900 dark:!text-neutral-100 !border-neutral-200 dark:!border-neutral-800 !shadow-lg group",
        duration: 5000, // 5 seconds before auto-dismiss
      }}
      richColors
      closeButton
      expand={false} // Don't expand on hover
      gap={12} // Space between toasts
    />
  );
}
