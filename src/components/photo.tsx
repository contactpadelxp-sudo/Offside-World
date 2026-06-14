"use client";

import Image from "next/image";

/* Photo optimisée (next/image) qui remplit son conteneur (parent en position relative).
   - chargement immédiat (pas de lazy) pour un affichage rapide
   - preload=true pour les images au-dessus de la ligne de flottaison (hero) */
export function Photo({
  src,
  alt,
  sizes,
  className,
  preload = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      loading="eager"
      className={className}
    />
  );
}
