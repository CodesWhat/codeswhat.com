import { Archive, BookOpen, Box, FileText, GitBranch, Layers3, PenLine } from "lucide-react";
import { WebglShowcaseScene } from "@/components/concepts/WebglShowcaseScene";

const evidence = [
  {
    label: "Drydock",
    title: "Release artifact stack",
    body: "A physical-feeling pile of registry notes, rollback proof, OIDC decisions, and docs deltas.",
    icon: Archive,
  },
  {
    label: "Rolester",
    title: "Agent workbench",
    body: "Gate verdicts, application packets, interview notes, and outcome loops shown as inspectable cards.",
    icon: Layers3,
  },
  {
    label: "CodesWhat",
    title: "Source-linked receipts",
    body: "Git branches, launch notes, visual states, and written field notes become the portfolio itself.",
    icon: GitBranch,
  },
];

const tableRows = [
  ["Drydock", "registry matrix", "23 providers", "docs-ready"],
  ["Drydock", "rollback proof", "audit trail", "operator-facing"],
  ["Rolester", "gate packet", "fit / comp / action", "agent-facing"],
  ["Rolester", "outcome ledger", "interviews + offers", "local-first"],
];

export function GalleryConcept() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#070606]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.16),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(251,113,133,0.12),transparent_30%),linear-gradient(135deg,#070606,#120f0d_58%,#0a0808)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.58fr_0.42fr] lg:items-center lg:py-16">
          <WebglShowcaseScene variant="archive" className="min-h-[620px] lg:min-h-[760px]" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-100 uppercase">
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              3D Archive
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Turn the portfolio into a table of evidence.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-neutral-300">
              Instead of flat case-study tiles, shipped work sits on a 3D archive table: cards,
              fragments, receipts, notes, and release objects.
            </p>
            <div className="mt-8 grid gap-3">
              {evidence.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-lg border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-amber-100">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-amber-200 uppercase">
                          {item.label}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-neutral-400">{item.body}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.38fr_0.62fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
              Archive index
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              The page can still scan like documentation after the 3D hook.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              The weird part gets attention. The structured index makes the work understandable.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
            {tableRows.map(([project, artifact, scope, status]) => (
              <div
                key={`${project}-${artifact}`}
                className="grid gap-3 border-white/10 border-b p-4 text-sm last:border-b-0 sm:grid-cols-[0.8fr_1fr_1fr_0.8fr]"
              >
                <span className="font-semibold text-white">{project}</span>
                <span className="text-neutral-300">{artifact}</span>
                <span className="text-neutral-400">{scope}</span>
                <span className="text-amber-200">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,rgba(251,191,36,0.1),rgba(251,113,133,0.08),rgba(103,232,249,0.08))]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            [FileText, "Release notes as objects"],
            [PenLine, "Field notes as proof"],
            [BookOpen, "Docs as part of the showcase"],
          ].map(([Icon, label]) => {
            const TypedIcon = Icon as typeof FileText;
            return (
              <div
                key={label as string}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm font-semibold text-neutral-200"
              >
                <TypedIcon className="h-5 w-5 text-amber-200" aria-hidden="true" />
                {label as string}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
