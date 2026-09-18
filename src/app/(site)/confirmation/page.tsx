import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmationContent } from "./confirmation-content";
import { metadonneesPage } from "@/lib/site";

/*
  La directive « use client » a quitté ce fichier : Next interdit d'exporter
  des métadonnées depuis un composant client, et cette page n'en avait donc
  aucune. Rien n'est perdu — l'interactivité (lecture de la référence dans
  l'URL) vit dans `confirmation-content.tsx`, qui reste client.

  `indexable: false` parce que la page est nominative : elle récapitule la
  réservation d'une personne désignée par sa référence. Indexée, elle
  exposerait ce récapitulatif dans les résultats de recherche, et elle
  figurerait au passage dans les pages de destination d'un tunnel qu'elle
  n'est pas censée ouvrir.
*/
export const metadata: Metadata = metadonneesPage({
  titre: "Votre réservation est confirmée | Offside Foot Indoor",
  description:
    "Le récapitulatif de votre réservation chez Offside Foot Indoor, le complexe de foot indoor de Gembloux.",
  chemin: "/confirmation",
  indexable: false,
});

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
