import Link from "next/link";
import {
  AjouterCreneau,
  AllerAuJour,
  ListeCreneaux,
  OuvrirPeriode,
} from "@/components/admin/actions-creneaux";
import { LienOnglet } from "@/components/admin/onglets";
import { lireCreneauxDuJour, lireEspaces } from "@/lib/db/backoffice";
import { jourCompact, jourISO, jourLisibleCap } from "@/lib/temps";
import { Calendrier, FlecheDroite, FlecheGauche } from "@/components/icons";

/** Midi UTC : la date reste la même quel que soit le décalage horaire. */
function versDate(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

function decaler(jour: string, jours: number): string {
  return jourISO(new Date(versDate(jour).getTime() + jours * 86_400_000));
}

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Le planning, jour par jour.
 *
 * CE QUI MANQUAIT POUR QUE CETTE PAGE SOIT CLAIRE.
 *
 * Elle montrait une liste de créneaux sans dire ce qu'on pouvait en faire, ni
 * ce que chaque mot voulait dire. « Fermer » et « Supprimer » ne sont pas la
 * même chose, « Libre » ne dit pas si le créneau est vendable, et le seul
 * bouton de la page — « Ouvrir une période » — régénère un planning d'après des
 * règles écrites dans le SQL, celles qu'on a posées faute de connaître les
 * vrais horaires du complexe.
 *
 * Trois corrections, dans cet ordre d'importance :
 *
 * 1. ON PEUT ENFIN AJOUTER UN CRÉNEAU À LA MAIN, et en supprimer un. Sans ça,
 *    l'exploitant ne pouvait pas saisir son planning — il pouvait seulement
 *    régénérer le nôtre.
 * 2. UN COMPTE DE CE QU'ON REGARDE, en tête de journée : combien de créneaux,
 *    combien de réservés, combien de fermés. La liste seule oblige à compter.
 * 3. LA DIFFÉRENCE ENTRE FERMER ET SUPPRIMER EST ÉCRITE, une fois, là où les
 *    deux boutons se trouvent — plutôt que devinée à l'usage.
 */
export default async function PageCreneaux({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const { jour: demande } = await searchParams;
  const aujourdhui = jourISO(new Date());
  const jour = demande && FORMAT_JOUR.test(demande) ? demande : aujourdhui;

  const [creneaux, espaces] = await Promise.all([lireCreneauxDuJour(jour), lireEspaces()]);
  const semaine = Array.from({ length: 7 }, (_, i) => decaler(jour, i - 3));

  const reserves = creneaux.filter((c) => c.reservePar).length;
  const fermes = creneaux.filter((c) => !c.ouvert && !c.reservePar).length;
  const libres = creneaux.length - reserves - fermes;

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Calendrier className="size-6 text-field" /> Créneaux
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Le planning que voient vos clients. Un créneau ouvert est réservable en ligne ; un créneau
        fermé disparaît du site sans être perdu.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/creneaux?jour=${decaler(jour, -1)}`}
          aria-label="Jour précédent"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheGauche className="size-4" />
        </Link>

        {/*
          La bande défilait à l'horizontale : sur téléphone, deux jours
          seulement tenaient, le second coupé en plein mot, et le jour
          réellement affiché plus bas pouvait n'y même pas figurer. Elle passe
          à la ligne, avec un format court — « Mer. 2 sept. » plutôt que
          « Mercredi 2 septembre » — pour que la semaine entière soit visible.
        */}
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {semaine.map((j) => (
            <LienOnglet key={j} href={`/admin/creneaux?jour=${j}`} actif={j === jour}>
              <span className="sm:hidden">{jourCompact(versDate(j))}</span>
              <span className="hidden sm:inline">{jourLisibleCap(versDate(j))}</span>
              {j === aujourdhui && <span className="text-xs opacity-70">(auj.)</span>}
            </LienOnglet>
          ))}
        </div>

        <Link
          href={`/admin/creneaux?jour=${decaler(jour, 1)}`}
          aria-label="Jour suivant"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheDroite className="size-4" />
        </Link>
      </div>

      <div className="mt-8 mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {jourLisibleCap(versDate(jour))}
          {/*
            CE QU'ON REGARDE, COMPTÉ. Sans ça, savoir combien de créneaux sont
            encore vendables un samedi demandait de parcourir la liste.
          */}
          {creneaux.length > 0 && (
            <span className="ml-2 font-normal normal-case tracking-normal">
              {libres} libre{libres > 1 ? "s" : ""}
              {reserves > 0 && ` · ${reserves} réservé${reserves > 1 ? "s" : ""}`}
              {fermes > 0 && ` · ${fermes} fermé${fermes > 1 ? "s" : ""}`}
            </span>
          )}
        </h2>
        <AllerAuJour jour={jour} />
      </div>

      <ListeCreneaux creneaux={creneaux} />

      {creneaux.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">Fermer</strong> retire de la vente en
          gardant le créneau — un tournoi, un jour de fermeture.{" "}
          <strong className="font-medium text-foreground">Supprimer</strong> (la croix) l&apos;efface
          définitivement. Un créneau réservé ne peut être ni fermé ni supprimé.
        </p>
      )}

      <div className="mt-8">
        <AjouterCreneau jour={jour} espaces={espaces} />
      </div>

      <div className="mt-6">
        <OuvrirPeriode debutParDefaut={aujourdhui} finParDefaut={decaler(aujourdhui, 180)} />
      </div>
    </div>
  );
}
