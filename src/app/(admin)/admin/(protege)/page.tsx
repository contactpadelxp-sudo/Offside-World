import Link from "next/link";
import { ActionsReservation } from "@/components/admin/actions-reservation";
import {
  lireReservations,
  type FiltreReservations,
  type ReservationAdmin,
} from "@/lib/db/backoffice";
import { AlerteTriangle, Ballon, Enveloppe, Gateau, PressePapier, Telephone, type IconType } from "@/components/icons";

const FILTRES: { valeur: FiltreReservations; label: string }[] = [
  { valeur: "a-venir", label: "À venir" },
  { valeur: "a-confirmer", label: "À confirmer" },
  { valeur: "passees", label: "Passées" },
  { valeur: "annulees", label: "Annulées" },
];

const TYPES: Record<string, { label: string; classe: string; icone: IconType }> = {
  anniversaire: { label: "Anniversaire", classe: "bg-kick/10 text-kick", icone: Gateau },
  bubble: { label: "Bubble Foot", classe: "bg-field/10 text-field", icone: Ballon },
};

const STATUTS: Record<string, { label: string; classe: string }> = {
  en_attente: { label: "À confirmer", classe: "bg-white/10 text-foreground" },
  confirmee: { label: "Confirmée", classe: "bg-field/15 text-field" },
  annulee: { label: "Annulée", classe: "bg-destructive/15 text-destructive" },
  expiree: { label: "Expirée", classe: "bg-white/5 text-muted-foreground" },
};

function Etiquette({ children, classe }: { children: React.ReactNode; classe: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${classe}`}>
      {children}
    </span>
  );
}

function Fiche({ r }: { r: ReservationAdmin }) {
  const type = TYPES[r.type] ?? TYPES.anniversaire;
  const statut = STATUTS[r.statut] ?? STATUTS.en_attente;
  const Icone = type.icone;

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Etiquette classe={type.classe}>
              <Icone className="size-3" />
              {type.label}
            </Etiquette>
            <Etiquette classe={statut.classe}>{statut.label}</Etiquette>
            <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
          </div>

          <h3 className="mt-2 font-bold">{r.clientNom}</h3>
          <p className="text-sm text-muted-foreground">
            {r.type === "anniversaire"
              ? `${r.formuleNom ?? "Formule"} — ${r.nbEnfants ?? "?"} enfants${
                  r.enfantPrenom
                    ? ` (${r.enfantPrenom}${r.enfantAge ? `, ${r.enfantAge} ans` : ""})`
                    : ""
                }`
              : `Bubble Foot — ${r.nbPersonnes ?? "?"} personnes`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-field">{r.total}€</p>
          <p className="text-sm font-medium">{r.jourLabel}</p>
          <p className="text-sm text-muted-foreground">
            {r.debut} – {r.fin}
          </p>
          {r.espaceNom && <p className="text-xs text-muted-foreground">{r.espaceNom}</p>}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/60 p-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          <a href={`tel:${r.clientTelephone}`} className="flex items-center gap-1.5 hover:text-field">
            <Telephone className="size-3.5 text-muted-foreground" />
            {r.clientTelephone}
          </a>
          <a href={`mailto:${r.clientEmail}`} className="flex items-center gap-1.5 hover:text-field">
            <Enveloppe className="size-3.5 text-muted-foreground" />
            {r.clientEmail}
          </a>
          {r.options.length > 0 && (
            <span>
              <span className="text-muted-foreground">Options : </span>
              {r.options.join(", ")}
            </span>
          )}
        </div>

        {(r.allergies || r.remarques) && (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            {[r.allergies, r.remarques].filter(Boolean).join(" — ")}
          </p>
        )}

        {r.noteInterne && (
          <p className="mt-2 border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Note interne : </span>
            {r.noteInterne}
          </p>
        )}
      </div>

      <ActionsReservation id={r.id} statut={r.statut} passee={r.passee} note={r.noteInterne} />
    </article>
  );
}

export default async function PageReservations({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const actif: FiltreReservations = FILTRES.some((f) => f.valeur === filtre)
    ? (filtre as FiltreReservations)
    : "a-venir";

  const reservations = await lireReservations(actif);
  const total = reservations.reduce((somme, r) => somme + r.total, 0);

  // Regroupement par journée : c'est ainsi qu'on prépare une journée de travail.
  const parJour = new Map<string, ReservationAdmin[]>();
  for (const r of reservations) {
    const liste = parJour.get(r.jourLabel);
    if (liste) liste.push(r);
    else parJour.set(r.jourLabel, [r]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            <PressePapier className="size-6 text-field" /> Réservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Les locations de terrain sont gérées sur Sport-Finder et n&apos;apparaissent pas ici.
          </p>
        </div>
        {(actif === "a-venir" || actif === "a-confirmer") && reservations.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Montant attendu</p>
            <p className="text-xl font-bold text-field">{total}€</p>
          </div>
        )}
      </div>

      <nav className="mt-5 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <Link
            key={f.valeur}
            href={f.valeur === "a-venir" ? "/admin" : `/admin?filtre=${f.valeur}`}
            aria-current={f.valeur === actif ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              f.valeur === actif
                ? "bg-field/15 text-field ring-1 ring-field/40"
                : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {reservations.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune réservation dans cette vue.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {[...parJour].map(([jourLabel, liste]) => (
            <section key={jourLabel}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {jourLabel}
              </h2>
              <div className="space-y-4">
                {liste.map((r) => (
                  <Fiche key={r.id} r={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
