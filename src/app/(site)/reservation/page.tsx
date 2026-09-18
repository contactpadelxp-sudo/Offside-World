import { Suspense } from "react";
import type { Metadata } from "next";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { metadonneesPage } from "@/lib/site";
import { lireCreneaux } from "@/lib/db/creneaux";
import { lireFormules, lireOptions } from "@/lib/db/referentiel";
import { expirerReservationsAbandonnees } from "@/lib/db/reservations";
import { prochainesDemiJournees } from "@/lib/demi-journees";
import { baseConfiguree } from "@/lib/supabase/server";
import { paiementConfigure } from "@/lib/paiement/stripe";
import { NOM_COMMERCIAL } from "@/data/entreprise";

/**
 * Page de réservation — rendue à chaque visite.
 *
 * Les disponibilités changent d'une minute à l'autre : les mettre en cache
 * afficherait des créneaux déjà pris. C'est la seule page du site qui n'est pas
 * prérendue, et c'est délibéré.
 */
export const dynamic = "force-dynamic";

/*
  Faute de métadonnées propres, cette page héritait du titre et de la
  description de l'accueil : deux pages annonçaient la même chose aux moteurs,
  et le lien partagé vers le tunnel de réservation s'affichait « Offside Foot
  Indoor Gembloux — Anniversaires… » sans jamais dire qu'on pouvait y réserver.
*/
export const metadata: Metadata = metadonneesPage({
  titre: `Réserver en ligne — anniversaire foot & Bubble Foot | ${NOM_COMMERCIAL}`,
  description:
    "Réservez en quelques minutes votre anniversaire foot ou votre session de Bubble Foot à Gembloux : formule, date, créneau et options en ligne.",
  chemin: "/reservation",
});

export default async function ReservationPage() {
  // Libère les créneaux tenus par des réservations jamais confirmées avant
  // d'afficher les disponibilités, pour ne pas montrer « complet » à tort.
  if (baseConfiguree()) await expirerReservationsAbandonnees();

  const [formules, options, creneauxAnniversaire, creneauxBubble] = await Promise.all([
    lireFormules(),
    lireOptions(),
    lireCreneaux("anniversaire"),
    lireCreneaux("bubble"),
  ]);

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>}>
      <ReservationFlow
        donnees={{
          formules,
          options,
          creneauxAnniversaire,
          creneauxBubble,
          demiJournees: prochainesDemiJournees(),
          // Le tunnel doit annoncer un paiement SEULEMENT s'il va vraiment
          // avoir lieu : promettre « on vous rappelle » puis débiter le client
          // est une pratique trompeuse, et le bouton doit dire ce qu'il fait.
          paiementActif: paiementConfigure(),
        }}
      />
    </Suspense>
  );
}
