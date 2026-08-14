import { notFound } from "next/navigation";
import { CoinStudio } from "@/components/site/scene/CoinStudio";

/**
 * Dev-only capture harness for minting the spinning coin as a transparent
 * animation — see scripts/capture-coin.mjs. Never meant to ship: it 404s in
 * production so no stray /studio/coin page goes live.
 *
 * Query params tune the shot, e.g. /studio/coin?dark=1&size=512&tilt=0.32
 */
export default async function CoinStudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const pick = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const num = (k: string, d: number) => {
    const n = Number(pick(k));
    return Number.isFinite(n) ? n : d;
  };
  return (
    <CoinStudio
      dark={pick("dark") === "1"}
      size={num("size", 512)}
      ss={num("ss", 3)}
      reeds={num("reeds", 90)}
      radius={num("radius", 1.5)}
      thickness={num("thickness", 0.34)}
      tilt={num("tilt", 0.32)}
      fov={num("fov", 32)}
      camZ={num("camz", 6.6)}
    />
  );
}
