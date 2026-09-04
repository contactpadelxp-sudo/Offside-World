import { BarreAdmin } from "@/components/admin/barre";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
