"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./catalogue.module.css";

export function SupportNavLink() {
  const pathname = usePathname();

  return (
    <Link
      href="/support"
      className={styles.navQuiet}
      aria-current={pathname === "/support" ? "page" : undefined}
    >
      Support
    </Link>
  );
}
