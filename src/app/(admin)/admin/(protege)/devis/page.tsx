import Link from "next/link";
import { ActionsDevis } from "@/components/admin/actions-devis";
import { lireDevis, type StatutDevis } from "@/lib/db/backoffice";
import { Document, Enveloppe, Groupe, Telephone } from "@/components/icons";

const LIBELLES: Record<StatutDevis, { label: string; classe: string }> = {
  nouvelle: { label: "Nouvelle", classe: "bg-kick/15 text-kick" },
  traitee: { label: "Prise en charge", classe: "bg-white/10 text-foreground" },
  devis_envoye: { label: "Devis envoyé", classe: "bg-field/15 text-field" },
  acceptee: { label: "Acceptée", classe: "bg-field/15 text-field" },
  refusee: { label: "Refusée", classe: "bg-destructive/15 text-destructive" },
};

export default async function PageDevis({
  searchParams,
}: {
  searchParams: Promise<{ toutes?: string }>;
}) {
  const { toutes } = await searchParams;
  const inclureTraites = toutes === "1";
  const devis = await lireDevis(inclureTraites);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            <Document className="size-6 text-field" /> Demandes de devis
          </h1>
          <p className="text-sm text-muted-foreground">
            Team building. Une demande n&apos;occupe aucun créneau tant qu&apos;elle n&apos;est pas
            transformée en réservation.
          </p>
        </div>
        <Link
          href={inclureTraites ? "/admin/devis" : "/admin/devis?toutes=1"}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          {inclureTraites ? "Masquer les demandes closes" : "Voir aussi les demandes closes"}
        </Link>
      </div>

      {devis.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune demande de devis en cours.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {devis.map((d) => {
            const statut = LIBELLES[d.statut];
            return (
              <article key={d.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${statut.classe}`}
                      >
                        {statut.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{d.reference}</span>
                    </div>
                    <h2 className="mt-2 font-bold">{d.entreprise}</h2>
                    <p className="text-sm text-muted-foreground">{d.contactNom}</p>
                  </div>

                  <div className="text-right text-sm">
                    {d.dateSouhaitee && <p className="font-medium">{d.dateSouhaitee}</p>}
                    {d.periode && <p className="text-muted-foreground">{d.periode}</p>}
                    {d.nbParticipants && (
                      <p className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Groupe className="size-3.5" />
                        {d.nbParticipants} participants
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-muted/60 p-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                    <a href={`tel:${d.contactTelephone}`} className="flex items-center gap-1.5 hover:text-field">
                      <Telephone className="size-3.5 text-muted-foreground" />
                      {d.contactTelephone}
                    </a>
                    <a href={`mailto:${d.contactEmail}`} className="flex items-center gap-1.5 hover:text-field">
                      <Enveloppe className="size-3.5 text-muted-foreground" />
                      {d.contactEmail}
                    </a>
                  </div>
                  {d.message && <p className="mt-2 text-sm">{d.message}</p>}
                  {d.noteInterne && (
                    <p className="mt-2 border-t border-border pt-2 text-sm">
                      <span className="text-muted-foreground">Note interne : </span>
                      {d.noteInterne}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">Reçue le {d.recuLe}</p>
                </div>

                <ActionsDevis id={d.id} statut={d.statut} note={d.noteInterne} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
