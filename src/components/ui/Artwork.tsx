"use client";

const COURT_GRADIENTS: readonly [string, string][] = [
  ["#3ddc6a", "#08501f"],
  ["#2ad4a0", "#07473a"],
  ["#34c759", "#0a6b2d"],
  ["#4cd964", "#0b3d1a"],
];

export function getGradientForSeed(seed: string): [string, string] {
  let hash = 7;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % COURT_GRADIENTS.length;
  return COURT_GRADIENTS[index];
}

type ArtworkProps = {
  src?: string | null;
  alt: string;
  seed: string;
  size?: "sm" | "card" | "hero";
  className?: string;
  showHoverBadge?: boolean;
};

export function Artwork({
  alt,
  seed,
  size = "card",
  className = "",
  showHoverBadge = false,
}: ArtworkProps) {
  const [from, to] = getGradientForSeed(seed);

  const sizeClass =
    size === "sm"
      ? "h-14 w-14 rounded-[12px] text-[26px] shrink-0"
      : size === "hero"
        ? "h-full w-full rounded-[24px]"
        : "aspect-square w-full rounded-[16px] text-[64px] shadow-[0_10px_26px_rgba(0,0,0,0.4)]";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative grid place-items-center overflow-hidden border border-white/15 ${sizeClass} ${size === "card" ? "bk-art-card" : ""} ${className}`}
      style={{
        background:
          size === "hero"
            ? `radial-gradient(circle at 80% 10%, rgba(255,255,255,0.32), transparent 50%), linear-gradient(150deg, ${from}, ${to})`
            : `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.34), transparent 45%), linear-gradient(145deg, ${from}, ${to})`,
      }}
    >
      {size === "hero" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-0 right-0 top-6 text-center text-[130px] leading-none drop-shadow-[0_18px_24px_rgba(0,0,0,0.4)] transition duration-500 group-hover:scale-105 group-hover:-rotate-3 min-[900px]:left-auto min-[900px]:right-[8%] min-[900px]:top-1/2 min-[900px]:-translate-y-1/2 min-[900px]:text-[200px]"
        >
          ⚽
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="select-none leading-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
        >
          ⚽
        </span>
      )}

      {showHoverBadge && (
        <span className="pointer-events-none absolute bottom-2.5 left-2.5 translate-y-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-bold text-black opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Reservar
        </span>
      )}
    </div>
  );
}
