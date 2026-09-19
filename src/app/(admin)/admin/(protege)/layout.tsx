import Link from "next/link";
import { BarreAdmin } from "@/components/admin/barre";
import { emailConfigure } from "@/lib/email/envoi";
import { AlerteTriangle } from "@/components/icons";
import { exigerSession } from "@/lib/admin/session";
import {
  compterAConfirmer,
  compterDevisANouveau,
  horizonParActivite,
} from "@/lib/db/backoffice";
import { expirerReservationsAbandonnees } from "@/lib/db/reservations";
import { resolveLogoSrc } from "@/lib/logo";

/**
 * Gabarit des pages protégées du back-office.
 *
 * C'EST ICI QUE L'ACCÈS EST RÉELLEMENT DÉCIDÉ. Le proxy a déjà écarté les
 * visiteurs sans cookie signé, mais il ne consulte pas la base : il ignore
 * qu'une session a expiré ou a été révoquée. `exigerSession()` le vérifie
 * vraiment, et redirige vers la connexion sinon.
 *
 * Le groupe `(protege)` ne change pas les URL : `/admin`, `/admin/devis`… Il
 * sert uniquement à laisser `/admin/connexion` hors de ce contrôle — sans quoi
 * il serait impossible de se connecter.
 */
export const dynamic = "force-dynamic";

export default async function GabaritProtege({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await exigerSession();

  // Libère les créneaux tenus par des réservations jamais confirmées, pour que
  // les compteurs et les listes reflètent l'état réel.
  await expirerReservationsAbandonnees();

  const [aConfirmer, devisNouveaux, horizons] = await Promise.all([
    compterAConfirmer(),
    compterDevisANouveau(),
    horizonParActivite(),
  ]);

  /*
    Deux mois d'avance : de quoi ouvrir une nouvelle période sans se presser,
    et bien avant qu'un client cherchant une date lointaine tombe sur un
    calendrier vide.

    DEUX SITUATIONS, ET IL NE FAUT PAS LES CONFONDRE. « Il reste 12 jours » est
    un rappel : on a le temps. « Aucun créneau » est une panne de vente en
    cours — l'activité ne se vend pas, maintenant, et personne ne l'apprendra
    autrement. Elles ne se disent donc pas avec la même phrase, et la seconde
    passe devant.
  */
  const epuisees = (horizons ?? []).filter((h) => h.jours === null);
  const bientot = (horizons ?? []).filter((h) => h.jours !== null && h.jours < 60);
  // Troisième état : la lecture a échoué. Le taire ferait passer une panne
  // d'alerte pour un calme plat — exactement ce qu'on vient de corriger.
  const horizonInconnu = horizons === null;

  return (
    <>
      <BarreAdmin
        acteur={session.acteur}
        aConfirmer={aConfirmer}
        devisNouveaux={devisNouveaux}
        logoSrc={resolveLogoSrc()}
      />

      {/*
        Les e-mails sont ignorés en silence quand le fournisseur n'est pas
        configuré : le site continue de fonctionner, mais personne n'est
        prévenu de rien. « En silence » est le problème — on le dit, partout,
        tant que ce n'est pas réglé. Le bandeau disparaît de lui-même ensuite.
      */}
      {!emailConfigure() && (
        <div className="border-b border-kick/25 bg-kick/10">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Aucun e-mail n&apos;est envoyé : ni le client ni vous n&apos;êtes prévenus des
              nouvelles réservations.{" "}
              <Link href="/admin/reglages" className="font-semibold underline">
                Voir les réglages
              </Link>
            </span>
          </p>
        </div>
      )}

      {/*
        Les créneaux ne se régénèrent pas tout seuls. Sans cette bannière, le
        jour où le dernier est passé, la page de réservation se vide en silence
        et personne ne l'apprend avant qu'un client renonce.

        Chaque activité a sa ligne : c'est tout l'intérêt. La version précédente
        regardait le dernier créneau toutes activités confondues et restait donc
        muette pendant que le Bubble Foot était à zéro, masqué par 943 créneaux
        d'anniversaire.
      */}
      {epuisees.length > 0 && (
        <div className="border-b border-destructive/30 bg-destructive/10">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm text-destructive">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {epuisees.map((h) => h.libelle).join(" et ")}
              {epuisees.length > 1 ? " ne se vendent pas" : " ne se vend pas"} : aucun créneau
              disponible, le tunnel affiche « aucun créneau ouvert ».{" "}
              <Link href="/admin/creneaux" className="font-semibold underline">
                Ouvrir une période
              </Link>
            </span>
          </p>
        </div>
      )}

      {horizonInconnu && (
        <div className="border-b border-kick/25 bg-kick/10">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Impossible de vérifier l&apos;état des créneaux. Ouvrez la page pour voir ce qui est
              réellement en vente.{" "}
              <Link href="/admin/creneaux" className="font-semibold underline">
                Voir les créneaux
              </Link>
            </span>
          </p>
        </div>
      )}

      {bientot.length > 0 && (
        <div className="border-b border-kick/25 bg-kick/10">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {bientot
                .map((h) => `${h.libelle} : ${h.jours} jour${h.jours! > 1 ? "s" : ""}`)
                .join(" · ")}{" "}
              avant le dernier créneau.{" "}
              <Link href="/admin/creneaux" className="font-semibold underline">
                Ouvrir une période
              </Link>
            </span>
          </p>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
