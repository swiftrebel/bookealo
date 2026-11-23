"use client";

import { useState } from "react";

const GRADIENTS: readonly [string, string][] = [
  ["#3ddc6a", "#08501f"],
  ["#3aa0ff", "#04224f"],
  ["#c777ff", "#3b1066"],
  ["#ff5e7e", "#7a1034"],
  ["#ffb340", "#7a2e05"],
  ["#2ad4a0", "#07473a"],
];

export function getGradientForSeed(seed: string): [string, string] {
  let hash = 7;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
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
  src,
  alt,
  seed,
  size = "card",
  className = "",
  showHoverBadge = false,
}: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const [from, to] = getGradientForSeed(seed);
  const hasImage = Boolean(src && !failed);
  const initials = alt
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const sizeClass =
    size === "sm"
      ? "h-14 w-14 rounded-[12px] text-lg shrink-0"
      : size === "hero"
        ? "h-full w-full rounded-[24px] text-6xl"
        : "aspect-square w-full rounded-[16px] text-4xl shadow-[0_10px_26px_rgba(0,0,0,0.4)]";

  return (
    <div
      className={`relative grid place-items-center overflow-hidden border border-white/15 font-extrabold tracking-tight text-white/90 ${sizeClass} ${size === "card" ? "bk-art-card" : ""} ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.32), transparent 45%), linear-gradient(145deg, ${from}, ${to})`,
      }}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? ""}
          alt={alt}
          loading={size === "hero" ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]">
          {initials || "BK"}
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
