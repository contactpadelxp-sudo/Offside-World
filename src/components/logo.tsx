"use client";

import Image from "next/image";

/**
 * Logo Offside World.
 *
 * `src` est résolu au build par `resolveLogoSrc()` (src/lib/logo.ts) : il suffit
 * de déposer le fichier dans `public/images/logo.{png,webp,svg,jpg}`. Tant qu'il
 * est absent, on retombe sur le lettrage texte — la navbar n'est jamais cassée.
 *
 * La taille se pilote par `className` (ex. "h-9 md:h-11") pour rester
 * responsive ; `height` ne sert que d'indice de rendu à next/image.
 */

// Ratio du logo détouré « OFFSIDE — FOOT INDOOR » (largeur / hauteur)
const RATIO = 3.8;

export function Logo({
  src,
  height,
  className = "",
  textClassName = "",
}: {
  src: string | null;
  height: number;
  className?: string;
  textClassName?: string;
}) {
  if (!src) {
    return (
      <span
        className={`font-bold tracking-tight font-[family-name:var(--font-heading)] whitespace-nowrap ${textClassName}`}
      >
        Offside <span className="text-gradient-field">World</span>
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt="Offside World — Foot Indoor"
      width={Math.round(height * RATIO)}
      height={height}
      preload
      loading="eager"
      className={`w-auto object-contain ${className}`}
    />
  );
}
