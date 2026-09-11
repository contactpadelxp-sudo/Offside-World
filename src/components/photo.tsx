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
  differe = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
  /**
   * Charge l'image seulement quand elle devient visible.
   *
   * POURQUOI CETTE OPTION EXISTE. Le hero rend deux mises en page : des lignes
   * compactes sur téléphone, des cartes avec photo au-delà. Celle qui ne sert
   * pas est masquée en CSS — et un navigateur télécharge quand même les images
   * d'un bloc `display: none` quand elles sont en chargement immédiat. Mesuré :
   * un téléphone récupérait QUATRE photos qu'il n'affiche jamais.
   *
   * En chargement différé, le navigateur ne les demande pas tant qu'elles ne
   * s'approchent pas de la fenêtre — ce qui n'arrive jamais si le bloc reste
   * masqué. À réserver aux images qui peuvent ne pas être affichées : pour tout
   * ce qui est visible d'emblée, le chargement immédiat reste meilleur.
   */
  differe?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      loading={differe ? "lazy" : "eager"}
      className={className}
    />
  );
}
