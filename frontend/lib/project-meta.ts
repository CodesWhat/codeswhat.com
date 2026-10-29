export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 110;
export const DESCRIPTION_MAX = 160;

type ProjectMetaInput = {
  name: string;
  tagline: string;
  about: string;
  kind: string;
  license: string;
  language: string;
};

export function projectTitle(p: Pick<ProjectMetaInput, "name" | "tagline">, siteName: string) {
  const bare = `${p.name}: ${p.tagline}`;
  const full = `${bare} | ${siteName}`;
  return full.length > TITLE_MAX ? bare : full;
}

/** "Server tool" reads as "server tool" mid-sentence; "macOS app" keeps its casing. */
function midSentence(kind: string) {
  return /^[A-Z][a-z]/.test(kind) ? kind[0].toLowerCase() + kind.slice(1) : kind;
}

export function projectDescription(p: ProjectMetaInput) {
  const forms = [
    `${p.about} ${p.license}, written in ${p.language}.`,
    `${p.about} Open-source ${midSentence(p.kind)} under ${p.license}, written in ${p.language}.`,
    `${p.about} ${p.license}, ${p.language}.`,
  ];
  const [plain, long, short] = forms;
  if (plain.length < DESCRIPTION_MIN) return long;
  if (plain.length > DESCRIPTION_MAX) return short;
  return plain;
}
