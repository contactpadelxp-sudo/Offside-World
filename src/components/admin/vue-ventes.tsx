import Form from "next/form";
import Link from "next/link";
import { LienOnglet } from "@/components/admin/onglets";
import { AlerteTriangle, Recu } from "@/components/icons";
import { RACCOURCIS, type Raccourci } from "@/lib/periode-ventes";
import { montantLisible } from "@/lib/tarification";
import {
  LIBELLE_ORIGINE,
  jourCourt,
  moisLong,
  periodeLisible,
  tauxLisible,
  type LigneRapport,
  type RapportVentes,
} from "@/lib/ventes";

/**
 * L'écran « Ventes » : les ventes en ligne d'une période, avec leur TVA — et
 * le fichier pour le comptable.
 *
 * Séparé de la page qui lit la base, pour être rendu tel quel avec des données
 * d'essai : c'est ainsi qu'on vérifie sa mise en page sans toucher aux vraies
 * ventes.
 *
 * Demandé par Brahim le 14 octobre 2026. L'écran montre les MÊMES chiffres que
 * les fichiers téléchargés : tous viennent de `lireRapportVentes`. Ce qu'on lit
 * ici avant d'envoyer est donc exactement ce que le comptable recevra.
 *
 * LES RACCOURCIS SONT DES MOIS ET DES TRIMESTRES CIVILS, parce qu'une
 * déclaration de TVA porte sur l'un ou l'autre — voir `periode-ventes.ts`.
 */

const BOUTON =
  "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97]";
const CHAMP_DATE =
  "h-9 rounded-lg border border-border bg-input/30 px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-field/60";

/** Combien de lignes de détail l'écran montre ; le fichier les contient toutes. */
const DETAIL_MAX = 200;

function Montant({ cents, gras = false }: { cents: number | null; gras?: boolean }) {
  if (cents === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`tabular-nums ${gras ? "font-semibold" : ""} ${cents < 0 ? "text-destructive" : ""}`}>
      {montantLisible(cents)}
    </span>
  );
}

function Tuile({ valeur, label, aide }: { valeur: string; label: string; aide?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-[family-name:var(--font-heading)] text-2xl font-bold tabular-nums">{valeur}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {aide && <p className="mt-1 text-xs text-muted-foreground">{aide}</p>}
    </div>
  );
}

export function VueVentes({
  r,
  raccourci,
}: {
  r: RapportVentes;
  raccourci: Raccourci | null;
}) {
  const { du, au } = r;

  const lienFichier = (format: "xlsx" | "csv") =>
    `/admin/ventes/export?du=${du}&au=${au}&format=${format}`;
  const detail: LigneRapport[] = [...r.ventes, ...r.remboursements].sort(
    (a, b) => b.jour.localeCompare(a.jour) || a.reference.localeCompare(b.reference)
  );
  const tvaComplete = r.ttcSansTauxCents === 0;
  const tauxManquants = r.avertissements.some((a) => a.startsWith("Taux de TVA non renseigné"));

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Recu className="size-6 text-field" /> Ventes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les paiements reçus en ligne et leur TVA, période par période — le récapitulatif à envoyer à
        votre comptable.
      </p>

      {/* ── La période ── */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Période">
        {RACCOURCIS.map((p) => (
          <LienOnglet key={p.valeur} href={`/admin/ventes?periode=${p.valeur}`} actif={raccourci === p.valeur}>
            {p.label}
          </LienOnglet>
        ))}
      </nav>

      <Form
        action="/admin/ventes"
        className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Du
          <input type="date" name="du" defaultValue={du} required className={CHAMP_DATE} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Au
          <input type="date" name="au" defaultValue={au} required className={CHAMP_DATE} />
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:border-field/40"
        >
          Afficher
        </button>
      </Form>

      {/* ── Le fichier ── */}
      <section className="mt-6 rounded-2xl border border-field/30 bg-field/5 p-5">
        <h2 className="font-semibold">
          Récapitulatif {periodeLisible(du, au)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Le fichier Excel contient le récapitulatif par taux de TVA, le détail de chaque vente et de
          chaque remboursement, et une note sur ce qu&apos;il couvre. C&apos;est celui à envoyer à votre
          comptable ; le CSV sert à l&apos;importer dans un logiciel.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {/* De vrais liens de téléchargement : le navigateur gère l'enregistrement. */}
          <a href={lienFichier("xlsx")} download className={`${BOUTON} bg-field text-[#0a0a0b] hover:bg-field-dark`}>
            Télécharger pour le comptable (Excel)
          </a>
          <a
            href={lienFichier("csv")}
            download
            className={`${BOUTON} border border-border text-muted-foreground hover:border-field/40 hover:text-foreground`}
          >
            Format CSV (import)
          </a>
        </div>
      </section>

      {/* ── À vérifier ── */}
      {r.avertissements.length > 0 && (
        <section className="mt-6 rounded-2xl border border-kick/40 bg-kick/10 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-kick">
            <AlerteTriangle className="size-4" /> À vérifier avant d&apos;envoyer
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            {r.avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {tauxManquants && (
            <Link
              href="/admin/tarifs"
              className="mt-3 inline-flex text-sm font-semibold text-field underline-offset-4 hover:underline"
            >
              Renseigner les taux dans Tarifs →
            </Link>
          )}
        </section>
      )}

      {/* ── En chiffres ── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tuile valeur={montantLisible(r.ventesTtcCents)} label="Ventes TVAC" aide={`${r.nombreVentes} paiement${r.nombreVentes > 1 ? "s" : ""}`} />
        <Tuile
          valeur={montantLisible(r.remboursementsTtcCents)}
          label="Remboursements TVAC"
          aide={`${r.nombreRemboursements} remboursement${r.nombreRemboursements > 1 ? "s" : ""}`}
        />
        <Tuile valeur={montantLisible(r.netTtcCents)} label="Net TVAC" />
        <Tuile
          valeur={tvaComplete ? montantLisible(r.netTvaCents) : "—"}
          label="TVA nette"
          aide={tvaComplete ? `HTVA : ${montantLisible(r.netHtCents)}` : "Des taux restent à renseigner"}
        />
      </div>

      {/* ── Par taux ── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Par taux de TVA</h2>
        {r.parTaux.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune vente ni aucun remboursement sur cette période.</p>
        ) : (
          <>
          {/*
            SUR TÉLÉPHONE, UNE FICHE PAR TAUX PLUTÔT QU'UN TABLEAU. Six colonnes
            ne tiennent pas sur 390 px : le tableau défilait de côté et cachait
            justement la TVA, la colonne qu'on vient chercher.
          */}
          <ul className="mt-3 divide-y divide-border/60 sm:hidden">
            {r.parTaux.map((t) => (
              <li key={String(t.tauxPourcent)} className="py-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{tauxLisible(t.tauxPourcent)}</span>
                  <Montant cents={t.netTtcCents} gras />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ventes {montantLisible(t.ventesTtcCents)} · Remboursements{" "}
                  {montantLisible(t.remboursementsTtcCents)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.netTvaCents === null || t.netHtCents === null
                    ? "HTVA et TVA non calculés"
                    : `HTVA ${montantLisible(t.netHtCents)} · TVA ${montantLisible(t.netTvaCents)}`}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Taux</th>
                  <th className="py-2 pr-3 text-right font-semibold">Ventes</th>
                  <th className="py-2 pr-3 text-right font-semibold">Remboursements</th>
                  <th className="py-2 pr-3 text-right font-semibold">Net TVAC</th>
                  <th className="py-2 pr-3 text-right font-semibold">Net HTVA</th>
                  <th className="py-2 text-right font-semibold">TVA</th>
                </tr>
              </thead>
              <tbody>
                {r.parTaux.map((t) => (
                  <tr key={String(t.tauxPourcent)} className="border-t border-border/60">
                    <td className="py-2 pr-3">{tauxLisible(t.tauxPourcent)}</td>
                    <td className="py-2 pr-3 text-right"><Montant cents={t.ventesTtcCents} /></td>
                    <td className="py-2 pr-3 text-right"><Montant cents={t.remboursementsTtcCents} /></td>
                    <td className="py-2 pr-3 text-right"><Montant cents={t.netTtcCents} gras /></td>
                    <td className="py-2 pr-3 text-right"><Montant cents={t.netHtCents} /></td>
                    <td className="py-2 text-right"><Montant cents={t.netTvaCents} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {/* ── Par mois ── */}
      {r.parMois.length > 1 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Par mois</h2>
          <ul className="mt-3 divide-y divide-border/60 sm:hidden">
            {r.parMois.map((m) => (
              <li key={m.mois} className="py-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold first-letter:uppercase">{moisLong(m.mois)}</span>
                  <Montant cents={m.netTtcCents} gras />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ventes {montantLisible(m.ventesTtcCents)} · Remboursements{" "}
                  {montantLisible(m.remboursementsTtcCents)}
                  {m.ttcSansTauxCents === 0 && ` · TVA ${montantLisible(m.netTvaCents)}`}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Mois</th>
                  <th className="py-2 pr-3 text-right font-semibold">Ventes</th>
                  <th className="py-2 pr-3 text-right font-semibold">Remboursements</th>
                  <th className="py-2 pr-3 text-right font-semibold">Net TVAC</th>
                  <th className="py-2 text-right font-semibold">TVA</th>
                </tr>
              </thead>
              <tbody>
                {r.parMois.map((m) => (
                  <tr key={m.mois} className="border-t border-border/60">
                    <td className="py-2 pr-3 first-letter:uppercase">{moisLong(m.mois)}</td>
                    <td className="py-2 pr-3 text-right"><Montant cents={m.ventesTtcCents} /></td>
                    <td className="py-2 pr-3 text-right"><Montant cents={m.remboursementsTtcCents} /></td>
                    <td className="py-2 pr-3 text-right"><Montant cents={m.netTtcCents} gras /></td>
                    <td className="py-2 text-right">
                      <Montant cents={m.ttcSansTauxCents === 0 ? m.netTvaCents : null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Le détail ── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Détail</h2>
        {detail.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Rien sur cette période.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-border/60 sm:hidden">
              {detail.slice(0, DETAIL_MAX).map((l, i) => (
                <li key={`${l.genre}-${l.reference}-${l.jour}-${i}`} className="py-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      <span className="tabular-nums">{jourCourt(l.jour)}</span> ·{" "}
                      <Link href={`/admin?q=${encodeURIComponent(l.reference)}`} className="font-mono underline-offset-2 hover:underline">
                        {l.reference}
                      </Link>
                    </span>
                    <Montant cents={l.ttcCents} gras />
                  </div>
                  <p className="mt-0.5">{l.designation}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {l.tauxPourcent === null || l.htCents === null || l.tvaCents === null
                      ? "Taux de TVA non renseigné"
                      : `${l.tauxPourcent} % · HTVA ${montantLisible(l.htCents)} · TVA ${montantLisible(l.tvaCents)}`}
                    {l.origineTaux === "actuel" && " · taux actuel"}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Référence</th>
                    <th className="py-2 pr-3 font-semibold">Désignation</th>
                    <th className="py-2 pr-3 text-right font-semibold">TVAC</th>
                    <th className="py-2 pr-3 text-right font-semibold">Taux</th>
                    <th className="py-2 pr-3 text-right font-semibold">HTVA</th>
                    <th className="py-2 text-right font-semibold">TVA</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.slice(0, DETAIL_MAX).map((l, i) => (
                    <tr key={`${l.genre}-${l.reference}-${l.jour}-${i}`} className="border-t border-border/60 align-top">
                      <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{jourCourt(l.jour)}</td>
                      <td className="whitespace-nowrap py-2 pr-3">
                        <Link
                          href={`/admin?q=${encodeURIComponent(l.reference)}`}
                          className="font-mono text-xs underline-offset-2 hover:underline"
                        >
                          {l.reference}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        {l.designation}
                        {l.origineTaux === "actuel" && (
                          <span className="ml-1 text-xs text-muted-foreground" title={LIBELLE_ORIGINE.actuel}>
                            · taux actuel
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right"><Montant cents={l.ttcCents} /></td>
                      <td className="py-2 pr-3 text-right">{l.tauxPourcent === null ? "—" : `${l.tauxPourcent} %`}</td>
                      <td className="py-2 pr-3 text-right"><Montant cents={l.htCents} /></td>
                      <td className="py-2 text-right"><Montant cents={l.tvaCents} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detail.length > DETAIL_MAX && (
              <p className="mt-2 text-xs text-muted-foreground">
                {DETAIL_MAX} lignes affichées sur {detail.length} : le fichier Excel les contient toutes.
              </p>
            )}
          </>
        )}
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        Ventes en ligne uniquement (Stripe). Ne sont pas comptés : les locations et le Bubble Foot
        vendus sur Sport-Finder, le bar, les paiements sur place et les factures de team building.
        Une vente est datée de son paiement, un remboursement du jour où il a été fait.
      </p>
    </div>
  );
}

/**
 * Ce qu'affiche « Ventes » tant que la base n'a pas reçu la migration 0040.
 *
 * Une page d'erreur générique aurait dit « base injoignable » — faux, et
 * inquiétant. Ici on dit ce qui manque, et que rien n'est perdu : les ventes
 * déjà faites seront reprises par la migration elle-même.
 */
export function VentesEnAttente() {
  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Recu className="size-6 text-field" /> Ventes
      </h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="font-medium">Le récapitulatif des ventes arrive.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Il attend une mise à jour de la base de données, qui n&apos;a pas encore été appliquée.
          Rien n&apos;est perdu : les ventes déjà faites y seront reprises automatiquement, avec leur
          détail.
        </p>
      </div>
    </div>
  );
}
