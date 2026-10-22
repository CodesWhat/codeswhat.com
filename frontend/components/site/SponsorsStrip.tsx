import Image from "next/image";
import { companies } from "@/lib/supporters";

/** Compact company-sponsor logos for the footer. Renders nothing while there are none. */
export function SponsorsStrip() {
  if (companies.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-wide text-fg-faint uppercase">Sponsors</p>
      <ul className="flex flex-wrap items-center gap-5">
        {companies.map((company) => (
          <li key={company.name}>
            <a href={company.url} target="_blank" rel="noopener noreferrer">
              <Image
                src={company.logo}
                alt={company.name}
                width={96}
                height={32}
                className="h-8 w-auto opacity-80 transition-opacity hover:opacity-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
