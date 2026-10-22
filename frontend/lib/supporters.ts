/**
 * Public supporters list. Add an entry here once someone has agreed to be
 * named. Logos live in /public/supporters.
 */

export type CompanySupporter = {
  name: string;
  url: string;
  /** path under /public, e.g. /supporters/acme.svg */
  logo: string;
};

export type PersonSupporter = {
  name: string;
  url?: string;
};

export const companies: readonly CompanySupporter[] = [];

export const people: readonly PersonSupporter[] = [];
