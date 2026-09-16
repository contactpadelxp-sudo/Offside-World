"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { seDeconnecter } from "@/lib/actions/session";
import { Voyant } from "@/components/admin/onglets";
import { Bouclier, Calendrier, Carte, Document, Graphique, Plume, PressePapier, Reglages, type IconType } from "@/components/icons";

/**
 * Barre du back-office.
 *
 * Elle ne contient AUCUN lien vers le site public : le back-office est une
 * application à part, on n'y navigue pas de proche en proche depuis la vitrine
 * et on n'en ressort pas par mégarde.
 */

const SECTIONS: { href: string; label: string; icone: IconType }[] = [
  { href: "/admin", label: "Réservations", icone: PressePapier },
  { href: "/admin/devis", label: "Devis", icone: Document },
  { href: "/admin/creneaux", label: "Créneaux", icone: Calendrier },
  { href: "/admin/tarifs", label: "Tarifs", icone: Carte },
  { href: "/admin/blog", label: "Blog", icone: Plume },
  { href: "/admin/analyse", label: "Analyse", icone: Graphique },
  { href: "/admin/journal", label: "Journal", icone: Bouclier },
  { href: "/admin/reglages", label: "Réglages", icone: Reglages },
];

function BoutonDeconnexion() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}

export function BarreAdmin({
  acteur,
  aConfirmer,
  devisNouveaux,
}: {
  acteur: string;
  aConfirmer: number;
  devisNouveaux: number;
}) {
  const chemin = usePathname();

  const pastille = (href: string) =>
    href === "/admin" ? aConfirmer : href === "/admin/devis" ? devisNouveaux : 0;

  return (
    /*
      Épinglée, cette barre confisquait 183 px — 27 % d'un écran de téléphone —
      en permanence, sur toutes les pages. Les huit rubriques ont besoin de
      plusieurs rangées pour rester lisibles (on refuse de tronquer, voir plus
      bas), donc la barre restera haute : autant la laisser défiler. Sur
      téléphone, la liste de travail occupe tout l'écran ; il faut remonter pour
      changer de section, ce qui est un geste, quand l'ancien réglage coûtait un
      quart de l'écran à chaque instant. Dès `sm:`, la place existe : on
      ré-épingle.
    */
    <header className="relative z-30 border-b border-border bg-[#0a0a0b]/95 backdrop-blur sm:sticky sm:top-0">
      {/* Bandeau de couleur : on voit d'un coup d'œil qu'on n'est pas sur le site public. */}
      <div className="h-1 bg-gradient-to-r from-field to-kick" />

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-heading)] text-sm font-bold tracking-wide text-field">
            OFFSIDE
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Back-office
          </span>
        </div>

        {/*
          UNE GRILLE DE DEUX COLONNES SUR TÉLÉPHONE, UNE RANGÉE À PARTIR DE `sm:`.

          La barre a d'abord défilé à l'horizontale : « Créneaux », « Tarifs »,
          « Journal » et « Réglages » étaient hors de l'écran, sans rien pour
          signaler qu'on pouvait balayer. On est passé au repli libre
          (`flex-wrap`), qui montrait bien les huit rubriques — mais à des
          positions dictées par la longueur des mots : deux sur la première
          rangée, trois sur la deuxième, deux sur la troisième, une seule sur la
          quatrième, et rien qui s'aligne d'une ligne à l'autre.

          En grille, les huit pavés ont la même largeur et forment un bloc
          régulier de 4 × 2. On retrouve une rubrique à sa place, pas là où le
          repli l'a laissée ; et la cible tactile monte à 40 px de haut sur
          toute la demi-largeur de l'écran, au lieu de la largeur du mot.

          Le compteur est poussé à droite par `ml-auto` : sur téléphone il se
          cale donc au bord du pavé, aligné avec celui du pavé voisin.

          `sm:flex-wrap` et non `sm:flex-nowrap` : mis bout à bout, les huit
          pavés mesurent 956 px. Sur une tablette de 768 px, la rangée unique
          sortait de la barre par la droite, et « Journal » comme « Réglages »
          n'étaient plus atteignables du tout — le conteneur ne défile pas. On
          les laisse se replier ; à partir de 1024 px, la place existe et la
          rangée redevient unique d'elle-même.

          Le libellé N'EST PAS tronqué. Il l'a été le temps d'un essai : avec la
          police doublée, « Réservations » y perdait 82 px et le pavé ne disait
          plus où il menait. Une rubrique de navigation se replie sur deux
          lignes, elle ne se coupe pas.
        */}
        <nav className="order-3 grid w-full grid-cols-1 gap-1.5 min-[360px]:grid-cols-2 sm:order-none sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1">
          {SECTIONS.map((s) => {
            const actif = s.href === "/admin" ? chemin === "/admin" : chemin.startsWith(s.href);
            const n = pastille(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={actif ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-[0.97] sm:min-h-0 sm:gap-1.5 sm:px-3 sm:text-sm ${
                  actif
                    ? "bg-field/15 text-field"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <s.icone className="size-4 shrink-0" />
                <span>{s.label}</span>
                {n > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-kick px-1.5 text-[11px] font-bold text-[#0a0a0b] sm:ml-0.5"
                    >
                      {n}
                    </span>
                    {/*
                      La pastille seule se lisait « Réservations 3 » : un nombre
                      sans unité, dont rien ne dit s'il s'agit de réservations
                      totales, de nouvelles ou d'un numéro de page. On dit ce
                      qu'il compte, pour les lecteurs d'écran uniquement.
                    */}
                    <span className="sr-only">
                      {" "}
                      — {n} {s.href === "/admin" ? "à confirmer" : "nouvelle" + (n > 1 ? "s" : "")}
                    </span>
                  </>
                )}
                <Voyant />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{acteur}</span>
          <form action={seDeconnecter}>
            <BoutonDeconnexion />
          </form>
        </div>
      </div>
    </header>
  );
}
