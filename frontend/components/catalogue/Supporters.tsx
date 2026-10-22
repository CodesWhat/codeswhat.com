import Image from "next/image";
import Link from "next/link";
import { companies, people } from "@/lib/supporters";
import styles from "./catalogue.module.css";

/** Supporters list for /support. Renders one invitation line while the list is empty. */
export function Supporters() {
  if (companies.length === 0 && people.length === 0) {
    return (
      <p className={styles.detailEmpty}>
        No supporters yet. Pick a <Link href="#tiers">tier</Link> and yours could be the first name
        here.
      </p>
    );
  }
  return (
    <div className={styles.supporters}>
      {companies.length > 0 && (
        <ul className={styles.logoRow}>
          {companies.map((company) => (
            <li key={company.name}>
              <a href={company.url} target="_blank" rel="noopener noreferrer">
                <Image src={company.logo} alt={company.name} width={120} height={40} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {people.length > 0 && (
        <ul className={styles.peopleRow}>
          {people.map((person) => (
            <li key={person.name}>
              {person.url ? (
                <a href={person.url} target="_blank" rel="noopener noreferrer">
                  {person.name}
                </a>
              ) : (
                person.name
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
