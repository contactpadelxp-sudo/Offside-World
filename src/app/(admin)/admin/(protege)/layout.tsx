import Link from "next/link";
import { BarreAdmin } from "@/components/admin/barre";
import { emailConfigure } from "@/lib/email/envoi";
import { AlerteTriangle } from "@/components/icons";
import { exigerSession } from "@/lib/admin/session";
import { compterAConfirmer, compterDevisANouveau } from "@/lib/db/backoffice";
import { expirerReservationsAbandonnees } from "@/lib/db/reservations";

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

  const [aConfirmer, devisNouveaux] = await Promise.all([
    compterAConfirmer(),
    compterDevisANouveau(),
  ]);

  return (
    <>
      <BarreAdmin acteur={session.acteur} aConfirmer={aConfirmer} devisNouveaux={devisNouveaux} />

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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
