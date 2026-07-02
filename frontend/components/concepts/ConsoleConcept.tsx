import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  CircleCheck,
  ExternalLink,
  Gauge,
  Github,
  Play,
  Radio,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Image from "next/image";

const products = [
  {
    name: "Drydock",
    description: "Deployment operations for shipping small products with repeatable confidence.",
    state: "Release candidate",
    health: "98.7%",
    build: "rc-04",
    window: "Launch review",
    accent: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    Icon: Box,
    signals: ["Preview URL healthy", "Runbook complete", "Billing hooks staged"],
  },
  {
    name: "Rolester",
    description: "Permission and team-role modeling for studios that need clear ownership.",
    state: "Preview build",
    health: "91.4%",
    build: "alpha-18",
    window: "Design partner",
    accent: "border-amber-300/40 bg-amber-300/10 text-amber-100",
    Icon: ShieldCheck,
    signals: ["Role matrix mapped", "Invite flow instrumented", "Audit trail in progress"],
  },
];

const consoleEvents = [
  { label: "studio:sync", value: "Drydock deployment candidate promoted" },
  { label: "rolester:test", value: "Team policy suite passed 42 checks" },
  { label: "docs:index", value: "Operator guides queued for editorial pass" },
  { label: "demo:ready", value: "Command walkthrough available" },
];

const metrics = [
  { label: "Active products", value: "02" },
  { label: "Open decisions", value: "07" },
  { label: "Ship lanes", value: "03" },
];

export function ConsoleConcept() {
  return (
    <section
      aria-labelledby="console-concept-title"
      className="min-h-screen bg-neutral-950 text-neutral-50"
    >
      <div className="border-b border-neutral-800 bg-neutral-950/95">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label="CodesWhat home">
            <span className="flex size-10 items-center justify-center rounded-md border border-emerald-300/30 bg-neutral-900">
              <Image
                src="/logos/codeswhat-logo-green.png"
                alt=""
                width={28}
                height={28}
                className="size-7"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">CodesWhat</span>
              <span className="block text-xs text-neutral-400">Product Studio</span>
            </span>
          </a>

          <nav aria-label="Product Studio links" className="hidden items-center gap-2 md:flex">
            <a
              href="/docs"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Docs
            </a>
            <a
              href="https://github.com/CodesWhat"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="size-4" aria-hidden="true" />
              GitHub
            </a>
            <a
              href="#console-demo"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Play className="size-4" aria-hidden="true" />
              Demo
            </a>
          </nav>
        </header>
      </div>

      <div className="bg-[linear-gradient(180deg,#050505_0%,#111111_54%,#171717_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-200">
                <Radio className="size-4" aria-hidden="true" />
                Live studio command center
              </div>
              <h1
                id="console-concept-title"
                className="max-w-3xl text-4xl font-semibold text-white sm:text-5xl lg:text-6xl"
              >
                Product Studio Console
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
                A serious umbrella shell for CodesWhat products, built around launch status,
                operating notes, and fast paths into each product workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="/docs"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Read the docs
                </a>
                <a
                  href="https://github.com/CodesWhat"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-neutral-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-neutral-500 hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="size-4" aria-hidden="true" />
                  View GitHub
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
                <a
                  href="#console-demo"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-300/50 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                >
                  <Play className="size-4" aria-hidden="true" />
                  Open demo
                </a>
              </div>
            </div>

            <div
              id="console-demo"
              className="rounded-lg border border-neutral-800 bg-neutral-950 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
            >
              <div className="flex flex-col gap-4 border-neutral-800 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                    <Terminal className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-white">Studio operations</h2>
                    <p className="text-sm text-neutral-400">Product readiness and launch flow</p>
                  </div>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-200">
                  <Activity className="size-4" aria-hidden="true" />
                  All systems nominal
                </div>
              </div>

              <div className="grid gap-0 md:grid-cols-[1fr_220px]">
                <div className="border-neutral-800 border-b p-4 md:border-r md:border-b-0 sm:p-6">
                  <div className="font-mono text-sm">
                    <div className="mb-4 flex items-center gap-2 text-neutral-500">
                      <span className="size-2 rounded-full bg-red-400" />
                      <span className="size-2 rounded-full bg-amber-300" />
                      <span className="size-2 rounded-full bg-emerald-300" />
                      <span className="ml-2">codeswhat-studio</span>
                    </div>
                    <div className="space-y-4">
                      {consoleEvents.map((event) => (
                        <div key={event.label} className="grid gap-1 sm:grid-cols-[130px_1fr]">
                          <span className="text-cyan-200">{event.label}</span>
                          <span className="text-neutral-300">{event.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-neutral-800 md:grid-cols-1 md:divide-x-0 md:divide-y">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="p-4">
                      <p className="text-2xl font-semibold text-white">{metric.value}</p>
                      <p className="mt-1 text-xs text-neutral-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {products.map((product) => {
              const ProductIcon = product.Icon;

              return (
                <article
                  key={product.name}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex size-12 items-center justify-center rounded-md border ${product.accent}`}
                      >
                        <ProductIcon className="size-6" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-semibold text-white">{product.name}</h2>
                          <span className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300">
                            {product.state}
                          </span>
                        </div>
                        <p className="mt-3 max-w-xl leading-7 text-neutral-300">
                          {product.description}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/products/${product.name.toLowerCase()}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-700 px-3 text-sm font-semibold text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Workspace
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>

                  <dl className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-neutral-800 bg-neutral-950/80 p-3">
                      <dt className="text-xs text-neutral-500">Health</dt>
                      <dd className="mt-1 flex items-center gap-2 font-semibold text-white">
                        <Gauge className="size-4 text-emerald-200" aria-hidden="true" />
                        {product.health}
                      </dd>
                    </div>
                    <div className="rounded-md border border-neutral-800 bg-neutral-950/80 p-3">
                      <dt className="text-xs text-neutral-500">Build</dt>
                      <dd className="mt-1 font-semibold text-white">{product.build}</dd>
                    </div>
                    <div className="rounded-md border border-neutral-800 bg-neutral-950/80 p-3">
                      <dt className="text-xs text-neutral-500">Window</dt>
                      <dd className="mt-1 font-semibold text-white">{product.window}</dd>
                    </div>
                  </dl>

                  <ul className="mt-6 space-y-3" aria-label={`${product.name} readiness signals`}>
                    {product.signals.map((signal) => (
                      <li key={signal} className="flex items-start gap-3 text-sm text-neutral-300">
                        <CircleCheck
                          className="mt-0.5 size-4 shrink-0 text-emerald-200"
                          aria-hidden="true"
                        />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
