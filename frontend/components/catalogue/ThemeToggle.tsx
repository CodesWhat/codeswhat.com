"use client";

import styles from "./catalogue.module.css";

/**
 * Flips data-theme on <html> and saves the explicit choice under the `theme` key, which the
 * nonce'd init script in the root layout reads back before first paint. Reading the DOM at
 * click time keeps this correct without any state to hydrate.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button type="button" className={styles.themeBtn} onClick={toggle}>
      Paper / Ink<span className={styles.srOnly}> (toggle light and dark theme)</span>
    </button>
  );
}
