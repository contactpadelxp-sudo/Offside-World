import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { lireDevisEnAttente, lireReservationsAVenir, type ReservationAdmin } from "@/lib/db/backoffice";
import { expirerReservationsAbandonnees } from "@/lib/db/reservations";
import { baseConfiguree } from "@/lib/supabase/server";
import { AlerteTriangle, Ballon, Batiment, Document, Enveloppe, Gateau, IconType, PressePapier, Telephone } from "@/components/icons";

/**
 * Back-office — réservations à venir.
 *
 * ACCÈS : fermé par authentification HTTP Basic dans `src/proxy.ts`, qui
 * s'exécute avant le rendu. Sans identifiants configurés, la page répond 404.
 *
 * PAS DE CACHE : `force-dynamic` empêche que cette page soit prérendue au build
 * ou conservée par le CDN. Une page contenant des noms, des téléphones et des
 * données de mineurs ne doit exister que le temps de la réponse.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Back-office — Réservations | Offside Foot Indoor",
  description: "Réservations à venir.",
  robots: { index: false, follow: false, nocache: true },
};

const BADGES: Record<string, { label: string; className: string; icon: IconType }> = {
  anniversaire: { label: "Anniversaire", className: "bg-kick/10 text-kick border-kick/30", icon: Gateau },
  bubble: { label: "Bubble Foot", className: "bg-field/10 text-field border-field/30", icon: Ballon },
};

const STATUTS: Record<string, { label: string; className: string }> = {
  en_attente: { label: "À confirmer", className: "bg-white/10 text-foreground border-white/20" },
  confirmee: { label: "Confirmée", className: "bg-field/10 text-field border-field/30" },
};

function LigneReservation({ r }: { r: ReservationAdmin }) {
  const badge = BADGES[r.type] ?? BADGES.anniversaire;
  const statut = STATUTS[r.statut] ?? STATUTS.en_attente;
  const Icon = badge.icon;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`${badge.className} gap-1`}>
                <Icon className="size-3" />
                {badge.label}
              </Badge>
              <Badge variant="outline" className={statut.className}>{statut.label}</Badge>
              <span className="text-xs font-mono text-muted-foreground">{r.reference}</span>
            </div>
            <h3 className="mt-2 font-bold">{r.clientNom}</h3>
            <p className="text-sm text-muted-foreground">
              {r.type === "anniversaire"
                ? `${r.formuleNom ?? "Formule"} — ${r.nbEnfants ?? "?"} enfants${
                    r.enfantPrenom ? ` (${r.enfantPrenom}${r.enfantAge ? `, ${r.enfantAge} ans` : ""})` : ""
                  }`
                : `Bubble Foot — ${r.nbPersonnes ?? "?"} personnes`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-field">{r.total}€</p>
            <p className="text-sm font-medium">{r.debut} – {r.fin}</p>
            {r.espaceNom && <p className="text-xs text-muted-foreground">{r.espaceNom}</p>}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-muted p-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Telephone className="size-3.5 text-muted-foreground" />
              {r.clientTelephone}
            </span>
            <span className="flex items-center gap-1.5">
              <Enveloppe className="size-3.5 text-muted-foreground" />
              {r.clientEmail}
            </span>
            {r.options.length > 0 && (
              <span>
                <span className="text-muted-foreground">Options : </span>
                {r.options.join(", ")}
              </span>
            )}
          </div>
          {(r.allergies || r.remarques) && (
            <p className="mt-2 text-sm text-kick font-medium flex items-start gap-1.5">
              <AlerteTriangle className="size-4 shrink-0 mt-0.5" />
              {[r.allergies, r.remarques].filter(Boolean).join(" — ")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  if (!baseConfiguree()) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 md:pt-28">
        <h1 className="text-2xl font-bold md:text-3xl">Back-office</h1>
        <p className="mt-4 text-muted-foreground">
          La base de données n&apos;est pas configurée sur cet environnement.
        </p>
      </div>
    );
  }

  await expirerReservationsAbandonnees();
  const [reservations, devis] = await Promise.all([lireReservationsAVenir(), lireDevisEnAttente()]);

  const total = reservations.reduce((somme, r) => somme + r.total, 0);
  const parJour = new Map<string, ReservationAdmin[]>();
  for (const r of reservations) {
    const liste = parJour.get(r.jourLabel);
    if (liste) liste.push(r);
    else parJour.set(r.jourLabel, [r]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 md:pt-28 md:pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
            <PressePapier className="size-7 text-field" /> Réservations à venir
          </h1>
          <p className="text-muted-foreground">Les 14 prochains jours.</p>
          <p className="text-xs text-muted-foreground">
            Les locations de terrain sont gérées sur Sport-Finder et n&apos;apparaissent pas ici.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Montant attendu</p>
          <p className="text-2xl font-bold text-field">{total}€</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {(["anniversaire", "bubble"] as const).map((type) => {
          const badge = BADGES[type];
          const Icon = badge.icon;
          return (
            <Card key={type}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{reservations.filter((r) => r.type === type).length}</p>
                <Badge variant="outline" className={`${badge.className} gap-1`}>
                  <Icon className="size-3" />
                  {badge.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{devis.length}</p>
            <Badge variant="outline" className="bg-white/10 text-foreground border-white/20 gap-1">
              <Batiment className="size-3" /> Devis
            </Badge>
          </CardContent>
        </Card>
      </div>

      {reservations.length === 0 ? (
        <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-muted-foreground">
          Aucune réservation dans les 14 prochains jours.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {[...parJour].map(([jourLabel, liste]) => (
            <section key={jourLabel}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                {jourLabel}
              </h2>
              <div className="space-y-4">
                {liste.map((r) => (
                  <LigneReservation key={r.id} r={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {devis.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Document className="size-4" /> Demandes de devis
          </h2>
          <div className="space-y-4">
            {devis.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">{d.reference}</span>
                      <h3 className="mt-1 font-bold">{d.entreprise}</h3>
                      <p className="text-sm text-muted-foreground">
                        {d.contactNom} · {d.contactTelephone} · {d.contactEmail}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {d.dateSouhaitee && <p className="font-medium capitalize">{d.dateSouhaitee}</p>}
                      {d.periode && <p className="text-muted-foreground">{d.periode}</p>}
                      {d.nbParticipants && (
                        <p className="text-muted-foreground">{d.nbParticipants} participants</p>
                      )}
                    </div>
                  </div>
                  {d.message && <p className="mt-3 rounded-xl bg-muted p-3 text-sm">{d.message}</p>}
                  <p className="mt-2 text-xs text-muted-foreground capitalize">Reçue le {d.recuLe}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
