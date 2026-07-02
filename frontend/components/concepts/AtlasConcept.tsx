import { ArrowUpRight, Boxes, Compass, Orbit, RadioTower, Sparkles } from "lucide-react";
import { WebglShowcaseScene } from "@/components/concepts/WebglShowcaseScene";

const orbitNodes = [
  {
    title: "Drydock",
    signal: "container operations",
    detail: "Registry intelligence, release evidence, audit trails, and docs as one project body.",
  },
  {
    title: "Rolester",
    signal: "agent workspace",
    detail: "A local-first job-search system with evidence, gates, prep, and outcome loops.",
  },
  {
    title: "Prototype bay",
    signal: "live experiments",
    detail: "The part of CodesWhat that should feel like a lab bench, not a brochure.",
  },
];

export function AtlasConcept() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#050706]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,255,0,0.18),transparent_32%),radial-gradient(circle_at_80%_12%,rgba(0,245,212,0.12),transparent_30%),linear-gradient(135deg,#050706,#09090d_50%,#061611)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.36fr_0.64fr] lg:items-center lg:py-16">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-lime-200 uppercase">
              <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
              3D Atlas
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Make CodesWhat a navigable object space.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-neutral-300">
              Drydock, Rolester, docs, experiments, and contact points become floating software
              objects around a studio core.
            </p>
            <div className="mt-8 grid gap-3">
              {orbitNodes.map((node) => (
                <article
                  key={node.title}
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-lime-300 uppercase">
                        {node.signal}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{node.title}</h3>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-neutral-500" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-400">{node.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <WebglShowcaseScene
            variant="atlas"
            className="order-first min-h-[560px] lg:order-none lg:min-h-[760px]"
          />
        </div>
      </section>

      <section className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:py-14">
          {[
            {
              icon: Compass,
              title: "Spatial homepage",
              body: "The first impression is a world model: objects, motion, depth, and project gravity.",
            },
            {
              icon: Boxes,
              title: "Product bodies",
              body: "Each project can open into its own docs, demo, changelog, and source trail.",
            },
            {
              icon: RadioTower,
              title: "Studio signal",
              body: "CodesWhat reads as the maker behind useful systems, not another generic consultancy.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-lg border border-white/10 bg-neutral-900 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-lime-300/25 bg-lime-300/10 text-lime-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-400">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_center,rgba(200,255,0,0.12),transparent_34%),#050706]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-lime-300 uppercase">
              Creative direction
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white">
              This should feel closer to the `scottbensondev` prototype: a live scene first, site
              chrome second.
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-neutral-300">
            <Sparkles className="h-5 w-5 text-lime-200" aria-hidden="true" />
            3D canvas, project objects, weird enough to remember.
          </div>
        </div>
      </section>
    </>
  );
}
