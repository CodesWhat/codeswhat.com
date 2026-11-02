import { GITHUB_URL, SITE_CONFIG } from "@/lib/site-config";
import styles from "./catalogue.module.css";
import { EmailSignupForm } from "./EmailSignupForm";
import { SponsorsStrip } from "./SponsorsStrip";
import { TrackedCtaLink } from "./TrackedCtaLink";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <EmailSignupForm />
        <div className={styles.footerLinks}>
          <TrackedCtaLink
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            placement="footer"
            ctaId="github_org"
          >
            GitHub<span className={styles.srOnly}> (opens in a new tab)</span>
          </TrackedCtaLink>
          <a href={SITE_CONFIG.twitterUrl} target="_blank" rel="noopener noreferrer">
            X<span className={styles.srOnly}> (opens in a new tab)</span>
          </a>
          <a href="mailto:hello@codeswhat.com">hello@codeswhat.com</a>
        </div>
      </div>
      <SponsorsStrip />
      <p className={styles.wordmark} aria-hidden="true">
        CodesWhat<em>?</em>
      </p>
      <p className={styles.fine}>
        Open source, no telemetry in the projects. This site counts visits with cookieless,
        anonymous stats and nothing more. The signup form loads Cloudflare Turnstile to keep bots
        out.
      </p>
    </footer>
  );
}
