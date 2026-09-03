"use client";

import { createContext, useContext } from "react";
import type { PhotoMap, PhotoSlot } from "@/lib/photos";

/**
 * Rend la table des photos résolue au build (côté serveur, dans le layout)
 * accessible aux composants clients, qui ne peuvent pas lire le disque.
 */
const PhotosContext = createContext<PhotoMap | null>(null);

export function PhotosProvider({
  value,
  children,
}: {
  value: PhotoMap;
  children: React.ReactNode;
}) {
  return <PhotosContext.Provider value={value}>{children}</PhotosContext.Provider>;
}

/** Chemin de la photo d'un emplacement, ou `null` si le fichier n'existe pas encore. */
export function usePhoto(slot: PhotoSlot): string | null {
  return useContext(PhotosContext)?.[slot] ?? null;
}
