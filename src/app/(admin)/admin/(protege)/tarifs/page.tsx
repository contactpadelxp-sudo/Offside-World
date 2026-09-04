import { FicheFormule, FicheOption } from "@/components/admin/fiche-tarif";
import { lireTarifsAdmin } from "@/lib/db/tarifs";
import { BUBBLE_MIN_PERSONNES, BUBBLE_PRIX_PAR_PERSONNE } from "@/data/bubble-team";
import { Carte, Info } from "@/components/icons";

export default async function PageTarifs() {
  const { formules, options } = await lireTarifsAdmin();

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Carte className="size-6 text-field" /> Tarifs
      </h1>
      <p className="text-sm text-muted-foreground">
        Ce que vous écrivez ici est ce qui sera facturé, et ce qui s&apos;affiche sur le site.
      </p>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-field" />
        <p>
          Les réservations déjà enregistrées ne changent pas : leur montant a été figé au moment de
          la réservation. Un nouveau tarif ne vaut que pour les suivantes.
        </p>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Formules anniversaire
      </h2>
      {formules.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune formule en base.
        </p>
      ) : (
        <div className="space-y-4">
          {formules.map((f) => (
            <FicheFormule key={f.id} f={f} />
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Options
      </h2>
      {options.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune option en base.
        </p>
      ) : (
        <div className="space-y-4">
          {options.map((o) => (
            <FicheOption key={o.id} o={o} />
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Bubble Foot
      </h2>
      {/*
        Le Bubble Foot se facture à la personne, pas au forfait : il n'entre pas
        dans la table `formules`, dont toute la structure suppose un prix de base
        et un supplément par enfant. Son tarif vit donc encore dans le code. On
        le dit plutôt que de laisser croire qu'il est modifiable ici.
      */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm">
          <strong>{BUBBLE_PRIX_PAR_PERSONNE} € par personne</strong>, à partir de{" "}
          {BUBBLE_MIN_PERSONNES} personnes.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce tarif est à la personne et non au forfait : il ne rentre pas dans la même structure que
          les formules anniversaire, et reste pour l&apos;instant dans le code du site. Le modifier
          demande une intervention de notre côté — dites-le-nous et c&apos;est fait dans la journée.
        </p>
      </div>
    </div>
  );
}
