import Link from "next/link";
import { GITHUB_URL } from "@/lib/site-config";
import styles from "./catalogue.module.css";
import { Sprite } from "./Sprite";
import { SupportNavLink } from "./SupportNavLink";
import { ThemeToggle } from "./ThemeToggle";
import { TrackedCtaLink } from "./TrackedCtaLink";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.masthead}>
        <div className={styles.mastheadMain}>
          <Link href="/" className={styles.brand}>
            <Sprite slug="coin" scale={1} label="" decorative className={styles.coin} />
            <span>
              CodesWhat<em>?</em>
            </span>
          </Link>
          <nav aria-label="Primary" className={styles.nav}>
            <Link href="/#specimens">Specimens</Link>
            <Link href="/#services">Services</Link>
            <SupportNavLink />
            <TrackedCtaLink
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              placement="header"
              ctaId="github_org"
            >
              GitHub<span className={styles.srOnly}> (opens in a new tab)</span>
            </TrackedCtaLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
