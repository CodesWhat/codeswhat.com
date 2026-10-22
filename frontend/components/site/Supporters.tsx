import Image from "next/image";
import Link from "next/link";
import { companies, people } from "@/lib/supporters";

/** Supporters list for /support. Renders one invitation line while the list is empty. */
export function Supporters() {
  if (companies.length === 0 && people.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        No supporters yet. Pick a{" "}
        <Link
          href="#tiers"
          className="underline decoration-brand/60 underline-offset-2 hover:text-brand-hover"
        >
          tier
        </Link>{" "}
        and yours could be the first name here.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {companies.length > 0 && (
        <ul className="flex flex-wrap items-center gap-6">
          {companies.map((company) => (
            <li key={company.name}>
              <a
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      {people.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
          {people.map((person) => (
            <li key={person.name}>
              {person.url ? (
                <a
                  href={person.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-brand/60 underline-offset-2 hover:text-brand-hover"
                >
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
