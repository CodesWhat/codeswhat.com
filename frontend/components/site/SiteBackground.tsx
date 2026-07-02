/**
 * Fixed dark background for the site — near-black base with a soft lime/teal
 * radial glow at the top that fades out below the fold. Matches the concept
 * shell / Atlas aesthetic. No grid, no grain — just the glow on black.
 */
export function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* near-black base */}
      <div className="absolute inset-0 bg-[#070809]" />

      {/* lime + teal glow, masked to fade out below ~70vh */}
      <div
        className="absolute inset-x-0 top-0 h-[115vh]"
        style={{
          background:
            "radial-gradient(52% 46% at 22% 8%, rgba(200,255,0,0.16), transparent 60%)," +
            "radial-gradient(48% 42% at 82% 6%, rgba(45,212,191,0.13), transparent 60%)," +
            "radial-gradient(60% 50% at 50% 0%, rgba(132,204,22,0.10), transparent 68%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
        }}
      />
    </div>
  );
}
