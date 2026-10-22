import Image from "next/image";
import { companies } from "@/lib/supporters";
import styles from "./catalogue.module.css";

/** Compact company-sponsor logos for the footer. Renders nothing while there are none. */
export function SponsorsStrip() {
  if (companies.length === 0) return null;
  return (
    <div className={styles.sponsorsStrip}>
      <p className={styles.eyebrow}>Sponsors</p>
      <ul className={styles.logoRow}>
        {companies.map((company) => (
          <li key={company.name}>
            <a href={company.url} target="_blank" rel="noopener noreferrer">
              <Image src={company.logo} alt={company.name} width={96} height={32} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
