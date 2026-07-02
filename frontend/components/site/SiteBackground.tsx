/**
 * Fixed site background. Off-white with a faint lime/teal glow in light mode,
 * near-black with an indigo/blue glow in dark mode (matching the inverted
 * brand accent — the coin turns indigo, so the wash does too). The glow fades
 * out below ~the fold. No grid, no grain — just the wash behind the 3D layer.
 */
export function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base — off-white in light, near-black in dark */}
      <div className="absolute inset-0 bg-[#f7f7f5] dark:bg-[#070809]" />

      {/* light-mode glow (softer tint that still reads on white) */}
      <div
        className="absolute inset-x-0 top-0 h-[115vh] dark:hidden"
        style={{
          background:
            "radial-gradient(52% 46% at 22% 8%, rgba(163,230,53,0.20), transparent 60%)," +
            "radial-gradient(48% 42% at 82% 6%, rgba(45,212,191,0.16), transparent 60%)," +
            "radial-gradient(60% 50% at 50% 0%, rgba(132,204,22,0.12), transparent 68%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
        }}
      />

      {/* dark-mode glow (indigo/blue on black — the inverted brand accent) */}
      <div
        className="absolute inset-x-0 top-0 hidden h-[115vh] dark:block"
        style={{
          background:
            "radial-gradient(52% 46% at 22% 8%, rgba(123,131,255,0.20), transparent 60%)," +
            "radial-gradient(48% 42% at 82% 6%, rgba(73,55,255,0.16), transparent 60%)," +
            "radial-gradient(60% 50% at 50% 0%, rgba(90,92,255,0.12), transparent 68%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 78%)",
        }}
      />
    </div>
  );
}
