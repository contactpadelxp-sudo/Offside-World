"use client";

import { useState } from "react";

/* Affiche /images/<base>.<ext> en essayant plusieurs extensions ;
   ne rend rien si aucune ne charge (le cadre/placeholder reste visible derrière). */
export function FrameImage({
  base,
  alt,
  className,
}: {
  base: string;
  alt: string;
  className?: string;
}) {
  const exts = ["png", "avif", "jpg", "jpeg", "webp"];
  const [i, setI] = useState(0);
  if (i >= exts.length) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/${base}.${exts[i]}`}
      alt={alt}
      className={className}
      onError={() => setI((n) => n + 1)}
    />
  );
}
