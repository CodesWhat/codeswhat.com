import { ArrowRight, Boxes, GalleryHorizontalEnd, MonitorDot, Orbit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const concepts = [
  {
    href: "/concepts/atlas",
    icon: Boxes,
    label: "Option 01",
    title: "CodesWhat Atlas",
    description:
      "The high-personality showcase: spatial project objects, HUD details, and a stronger prototype energy.",
    palette: "from-lime-300/22 via-teal-300/10 to-fuchsia-300/10",
  },
  {
    href: "/concepts/console",
    icon: MonitorDot,
    label: "Option 02",
    title: "Product Studio Console",
    description:
      "The credible umbrella brand: product status, docs paths, repo links, and a focused studio shell.",
    palette: "from-sky-300/20 via-lime-300/10 to-orange-300/10",
  },
  {
    href: "/concepts/gallery",
    icon: GalleryHorizontalEnd,
    label: "Option 03",
    title: "Artifact Gallery",
    description:
      "The tactile case-study wall: shipped work, release notes, diagrams, and product fragments.",
    palette: "from-rose-300/20 via-amber-300/10 to-teal-300/10",
  },
  {
    href: "/concepts/board",
    icon: Orbit,
    label: "Option 04",
    title: "3D Board",
    description:
      "The live WebGL board ported from scottbensondev: real 3D cards, rapier physics, a grab-and-rip interaction, and true liquid glass.",
    palette: "from-lime-300/22 via-sky-300/10 to-violet-300/12",
  },
];

export default function ConceptsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(200,255,0,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(20,184,166,0.15),transparent_28%),linear-gradient(135deg,#08080a,#17171d_55%,#090f0d)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-3 text-sm font-medium text-neutral-300 transition hover:text-lime-200"
          >
            <Image
              src="/logos/codeswhat-logo-green.png"
              alt=""
              width={34}
              height={34}
              className="rounded-lg"
              priority
            />
            CodesWhat
          </Link>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-lime-300 uppercase">
            Website direction prototypes
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Three ways to make CodesWhat feel like a real showcase.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
            Each route is a different homepage posture: expressive spatial canvas, serious product
            studio, or tactile case-study wall.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:py-16">
        {concepts.map((concept) => {
          const Icon = concept.icon;
          return (
            <Link
              key={concept.href}
              href={concept.href}
              className="group relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-neutral-900 p-6 transition hover:-translate-y-1 hover:border-lime-300/45"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${concept.palette}`} />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/12 bg-black/24 px-3 py-1 text-xs font-semibold text-neutral-300">
                    {concept.label}
                  </span>
                  <Icon className="h-5 w-5 text-lime-200" />
                </div>
                <div className="mt-auto">
                  <h2 className="text-3xl font-semibold tracking-tight text-white">
                    {concept.title}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-neutral-300">{concept.description}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-lime-200">
                    Open prototype
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
