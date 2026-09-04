import { Suspense } from "react";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { lireCreneaux } from "@/lib/db/creneaux";
import { lireFormules, lireOptions } from "@/lib/db/referentiel";
import { expirerReservationsAbandonnees } from "@/lib/db/reservations";
import { prochainesDemiJournees } from "@/lib/demi-journees";
import { baseConfiguree } from "@/lib/supabase/server";

/**
 * Page de réservation — rendue à chaque visite.
 *
 * Les disponibilités changent d'une minute à l'autre : les mettre en cache
 * afficherait des créneaux déjà pris. C'est la seule page du site qui n'est pas
 * prérendue, et c'est délibéré.
 */
export const dynamic = "force-dynamic";

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
        }}
      />
    </Suspense>
  );
}
