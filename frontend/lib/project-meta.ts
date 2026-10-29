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

export function projectDescription(p: ProjectMetaInput) {
  const forms = [
    `${p.about} ${p.license}, written in ${p.language}.`,
    `${p.about} Open-source ${p.kind} under ${p.license}, written in ${p.language}.`,
    `${p.about} ${p.license}, ${p.language}.`,
  ];
  const [plain, long, short] = forms;
  if (plain.length < DESCRIPTION_MIN) return long;
  if (plain.length > DESCRIPTION_MAX) return short;
  return plain;
}
