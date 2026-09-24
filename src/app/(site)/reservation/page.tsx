import { Suspense } from "react";
import type { Metadata } from "next";
import { ReservationFlow } from "@/components/reservation/reservation-flow";
import { metadonneesPage } from "@/lib/site";
import { lireCreneaux } from "@/lib/db/creneaux";
import { lireFormules, lireOptions } from "@/lib/db/referentiel";
import { compterEspacesActifs, expirerReservationsAbandonnees } from "@/lib/db/reservations";
import { demiJourneesDepuisCreneaux } from "@/lib/demi-journees";
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

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /*
    LE RETOUR D'UN PAIEMENT ABANDONNÉ SE DIT, MAINTENANT.

    `?paiement=annule` existait déjà dans le `cancel_url` de Stripe, et aucune
    page ne le lisait : le client renonçait à payer, retombait sur un tunnel
    vide, et rien ne lui disait ni qu'il n'avait pas été débité, ni que sa
    demande n'était pas passée. C'est le moment où l'on abandonne pour de bon,
    faute de comprendre où l'on en est.

    Le message est délibérément prudent sur le créneau : la route d'annulation
    essaie de le rendre à la vente, mais elle peut échouer, et promettre qu'il
    est à nouveau libre serait une promesse que cette page ne peut pas tenir.
  */
  const params = await searchParams;
  const brut = params.paiement;
  const paiementAnnule = (Array.isArray(brut) ? brut[0] : brut) === "annule";

  // Libère les créneaux tenus par des réservations jamais confirmées avant
  // d'afficher les disponibilités, pour ne pas montrer « complet » à tort.
  if (baseConfiguree()) await expirerReservationsAbandonnees();

  const [formules, options, creneauxAnniversaire, creneauxBubble, creneauxTeamBuilding, nbTerrains] =
    await Promise.all([
      lireFormules(),
      lireOptions(),
      lireCreneaux("anniversaire"),
      lireCreneaux("bubble"),
      // Le team building a ses vrais créneaux depuis la migration 0036 : ce
      // qui s'affiche libre est ce que la base acceptera de tenir.
      lireCreneaux("team_building"),
      /*
        Le team building privatise le complexe : une période n'est libre que
        si tous les terrains le sont. En cas de panne, ZÉRO — tout s'affiche
        complet. C'est le bon côté pour se tromper : un « complet » à tort
        coûte un e-mail, un « libre » à tort promet une place que le serveur
        refusera au moment d'envoyer.
      */
      baseConfiguree()
        ? compterEspacesActifs().catch((e) => {
            console.error("Terrains en service illisibles :", e);
            return 0;
          })
        : Promise.resolve(0),
    ]);

  /*
    LE BANDEAU PASSE PAR LE TUNNEL, IL NE SE MET PAS À CÔTÉ.

    Rendu ici, à la racine de la page, il tombait sous l'en-tête `fixed` du
    site — dont le bord inférieur est à 104 px — et n'était donc jamais vu.
    Le conteneur du tunnel est le seul à porter le `pt-32` qui dégage la zone :
    c'est lui qui doit l'afficher.

    `role="status"` et non `alert` : renoncer à payer n'est pas une erreur, et
    l'annonce ne doit pas couper ce que le lecteur d'écran est en train de lire.
  */
  const bandeau = paiementAnnule ? (
    <div
      role="status"
      className="mb-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
    >
      <p className="font-medium">Paiement annulé — vous n&apos;avez pas été débité.</p>
      <p className="mt-0.5 text-muted-foreground">
        Votre demande n&apos;a donc pas été enregistrée. Reprenez ci-dessous : le créneau
        vous est proposé à nouveau s&apos;il est toujours libre.
      </p>
    </div>
  ) : null;

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>}>
      <ReservationFlow
        bandeau={bandeau}
        donnees={{
          formules,
          options,
          creneauxAnniversaire,
          creneauxBubble,
          demiJournees: demiJourneesDepuisCreneaux(creneauxTeamBuilding, nbTerrains),
          // Le tunnel doit annoncer un paiement SEULEMENT s'il va vraiment
          // avoir lieu : promettre « on vous rappelle » puis débiter le
          // client est une pratique trompeuse, et le bouton doit dire ce
          // qu'il fait.
          paiementActif: paiementConfigure(),
        }}
      />
    </Suspense>
  );
}
