"use client";

import { useState } from "react";

const NOCTURNAL_GRADIENTS: readonly [string, string][] = [
  ["#2f9e55", "#0f3d22"],
  ["#2d6a4f", "#0d2b1f"],
  ["#0a6e8a", "#022e3c"],
  ["#227a46", "#0a2e18"],
];

export function getGradientForSeed(seed: string): [string, string] {
  let hash = 7;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % NOCTURNAL_GRADIENTS.length;
  return NOCTURNAL_GRADIENTS[index];
}

function isRenderableUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/")
  );
}

type ArtworkProps = {
  src?: string | null;
  alt: string;
  seed: string;
  size?: "sm" | "card" | "hero" | "cover";
  className?: string;
  showHoverBadge?: boolean;
};

function CourtWireframe({
  className,
  strokeWidth = 0.8,
  strokeOpacity = 0.45,
}: {
  className?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke={`rgba(255,255,255,${strokeOpacity})`}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="4" width="112" height="72" rx="2" />
      <line x1="60" y1="4" x2="60" y2="76" />
      <circle cx="60" cy="40" r="9" />
      <rect x="4" y="22" width="16" height="36" />
      <rect x="100" y="22" width="16" height="36" />
      <rect x="4" y="32" width="6" height="16" />
      <rect x="110" y="32" width="6" height="16" />
    </svg>
  );
}

export function Artwork({
  src,
  alt,
  seed,
  size = "card",
  className = "",
}: ArtworkProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [from, to] = getGradientForSeed(seed);
  const showImage = isRenderableUrl(src) && !imgFailed;

  const sizeClass =
    size === "sm"
      ? "h-12 w-12 rounded-[12px] shrink-0"
      : size === "hero" || size === "cover"
        ? "h-full w-full rounded-[24px]"
        : "aspect-square w-full rounded-[18px]";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative grid place-items-center overflow-hidden ${sizeClass} ${size === "card" ? "bk-cover-media" : ""} ${className}`}
      style={{
        background: `linear-gradient(160deg, ${from}, ${to})`,
      }}
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onError={() => setImgFailed(true)}
            className={`h-full w-full object-cover ${
              size === "hero" || size === "cover" ? "bk-hero-art" : ""
            }`}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black/25"
          />
        </>
      ) : (
        <>
          {(size === "cover" || size === "hero") && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/25"
            />
          )}

          {size === "hero" ? (
            <CourtWireframe
              strokeWidth={0.75}
              strokeOpacity={0.35}
              className="bk-hero-art pointer-events-none absolute left-1/2 top-[38%] h-[140px] w-auto -translate-x-1/2 min-[900px]:left-auto min-[900px]:right-[7%] min-[900px]:top-1/2 min-[900px]:h-[65%] min-[900px]:translate-x-0 min-[900px]:-translate-y-1/2"
            />
          ) : size === "cover" ? (
            <CourtWireframe
              strokeWidth={0.6}
              strokeOpacity={0.4}
              className="bk-hero-art pointer-events-none relative z-10 h-[76%] w-auto max-w-[85%]"
            />
          ) : size === "sm" ? (
            <CourtWireframe
              strokeWidth={1.6}
              strokeOpacity={0.6}
              className="h-auto w-[64%]"
            />
          ) : (
            <CourtWireframe
              strokeWidth={1.15}
              strokeOpacity={0.5}
              className="h-auto w-[55%]"
            />
          )}
        </>
      )}
    </div>
  );
}
