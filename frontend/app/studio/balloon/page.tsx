import { notFound } from "next/navigation";
import { BalloonStudio } from "@/components/site/scene/BalloonStudio";

/**
 * Dev-only capture harness for minting a mascot balloon as a transparent icon /
 * spin — see scripts/capture-assets.mjs. 404s in production so it never ships.
 *
 * /studio/balloon?balloon=portkey&tilt=0.3&dark=0  (or ?url=/logos/foo.png)
 */
export default async function BalloonStudioPage({
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
  const slug = pick("balloon");
  const url = pick("url") ?? (slug ? `/logos/${slug}-balloon.png` : "/logos/portkey-balloon.png");
  return (
    <BalloonStudio
      url={url}
      dark={pick("dark") === "1"}
      size={num("size", 512)}
      ss={num("ss", 3)}
      worldSize={num("world", 2.6)}
      tilt={num("tilt", 0.3)}
      fov={num("fov", 32)}
      camZ={num("camz", 6.6)}
    />
  );
}
