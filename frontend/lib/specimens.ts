import { CATEGORY_LABELS, GITHUB_URL, PROJECTS } from "./site-config.ts";

export type Specimen = {
  slug: string;
  no: string;
  name: string;
  latin: string;
  kind: string;
  license: string;
  language: string;
  tagline: string;
  about: string;
  habitat: string;
  diet: string;
  temperament: string;
  marks: string;
  handling: string;
  site: string;
  repo?: string;
  docs?: string;
  alt: string;
};

type Field = Pick<
  Specimen,
  "latin" | "habitat" | "diet" | "temperament" | "marks" | "handling" | "alt"
> & { docs?: string; repo?: string };

const FIELD: Record<string, Field> = {
  drydock: {
    latin: "Balaena siccata",
    habitat: "Home servers, homelab racks, one cupboard",
    diet: "Image tags, registry digests, changelogs",
    temperament: "Notices everything. Will tell you about it.",
    marks: "Glossy sky blue, one eye, and the eye is an X. The X is not a mood.",
    handling:
      "Self-hosted. Point it at what you're running and it flags outdated or exposed images, then says so.",
    alt: "Pixel art of a glossy blue toy whale facing left, with a round white eye marked with an X",
    docs: "https://getdrydock.com/docs",
    repo: `${GITHUB_URL}/drydock`,
  },
  sockguard: {
    latin: "Canis custos",
    habitat: "In front of /var/run/docker.sock, wherever that is",
    diet: "Docker API requests. Refuses most of them.",
    temperament: "Says no first. Has never been talked out of it.",
    marks:
      "Brown and orange, white muzzle, studded collar. Looks friendly until you ask for a port.",
    handling:
      "Sits in front of the Docker socket. You list the requests allowed through and everything else is refused.",
    alt: "Pixel art of a brown toy bulldog facing left with a spiked black collar, a white muzzle and an X for an eye",
    docs: "https://getsockguard.com/docs",
    repo: `${GITHUB_URL}/sockguard`,
  },
  portwing: {
    latin: "Columba portalis",
    habitat: "The far side of a firewall",
    diet: "Container commands, relayed one at a time",
    temperament: "Carries the message. Does not open the door.",
    marks: "Grey pigeon, purple and teal neck bands, orange feet, one X for an eye.",
    handling:
      "Runs beside Docker so you can control containers from anywhere, without exposing the daemon.",
    alt: "Pixel art of a grey pigeon facing left with an orange beak, purple and teal neck bands and an X for an eye",
    docs: "https://portwing.codeswhat.com/docs",
    repo: `${GITHUB_URL}/portwing`,
  },
  "portkey-admin-mcp": {
    latin: "Clavis administra",
    habitat: "Inside whichever MCP client asks nicely",
    diet: "Configs, keys, guardrails, analytics",
    temperament: "Holds a great many keys. Has lost none.",
    marks: "A hexagon with a chevron in it, over a squiggle. No feathers, no fur.",
    handling:
      "An MCP server for the Portkey admin API. Manage configs, keys, guardrails and analytics from any MCP client.",
    alt: "Pixel art of a dark tile with a red-to-blue hexagon holding a chevron, above a white squiggle",
    docs: `${GITHUB_URL}/portkey-admin-mcp/tree/main/docs`,
    repo: `${GITHUB_URL}/portkey-admin-mcp`,
  },
  mouthtype: {
    latin: "Os scribens",
    habitat: "The menu bar of a Mac",
    diet: "Audio, only while a key is held down",
    temperament: "Speaks when spoken to.",
    marks: "Red lips, a dark mouth, and a text cursor where you'd expect a tongue.",
    handling: "Local push-to-talk dictation for macOS. Mouth in, text back.",
    alt: "Pixel art of glossy red lips with a dark mouth and a white text cursor, on an orange tile",
    docs: "https://docs.mouthtype.app",
    repo: `${GITHUB_URL}/mouthtype`,
  },
  idlescreen: {
    latin: "Cathodus somnians",
    habitat: "Any Mac left alone long enough",
    diet: "Idle time, served as 19 procedural patterns",
    temperament: "Dreams in monospace.",
    marks:
      "A silver CRT with a green ghost on it, split into red and blue. Do not adjust your set.",
    handling: "An ASCII art screen saver for macOS, rendered in Metal. Leave the room.",
    alt: "Pixel art of a silver CRT monitor whose green screen shows a ghostly figure split into orange and blue",
    repo: `${GITHUB_URL}/idlescreen`,
  },
  careerrat: {
    latin: "Rattus laborans",
    habitat: "A browser tab and your own AI CLI",
    diet: "Job listings, resumes, interview notes",
    temperament: "Overqualified. Applying anyway.",
    marks: "Grey rat, blue tie, brown briefcase, both eyes X'd out. Job hunting does that.",
    handling:
      "A chat-first workspace that finds, vets, tailors, tracks and preps roles, using your own AI CLI.",
    alt: "Pixel art of a grey cartoon rat in a white shirt and blue tie holding a brown briefcase, with X eyes",
    docs: "https://careerrat.com/docs",
    repo: `${GITHUB_URL}/careerrat`,
  },
  "systema-machinae": {
    latin: "Machina recensens",
    habitat: "systemamachinae.com, on a small rented VPS",
    diet: "User-agent strings. Names every bot it meets.",
    temperament: "Counts the visitors who aren't people.",
    marks: "A beige server on two feet with smoke coming off one corner. The smoke is normal.",
    handling: "A live census of the bots that visit a website, set as a field guide. Lab project.",
    alt: "Pixel art of a small beige server tower with two eyes, three rack units and smoke rising from one corner",
  },
};

export const SPECIMENS: Specimen[] = PROJECTS.map((p, i) => {
  const [license, language] = p.status.split(" · ");
  return {
    slug: p.slug,
    no: String(i + 1).padStart(2, "0"),
    name: p.name,
    kind: CATEGORY_LABELS[p.category],
    license,
    language,
    tagline: p.tagline,
    about: p.description,
    site: p.href,
    ...FIELD[p.slug],
  };
});

export const bySlug = (slug: string) => SPECIMENS.find((s) => s.slug === slug);

export const SERVICES = [
  {
    title: "Zero to one, fast",
    body: "Idea to a shipped product in weeks, not quarters. Prototypes and MVPs that actually hold up.",
  },
  {
    title: "Get good with AI tools",
    body: "Learn to use AI coding agents for real work. The workflows that stick, not the demos.",
  },
  {
    title: "Automate the busywork",
    body: "Internal tools and automation for the repetitive stuff, built to fit how you already work.",
  },
];
