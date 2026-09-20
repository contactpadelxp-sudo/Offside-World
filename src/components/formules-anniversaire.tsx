"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Coche, FlecheDroite, Gateau } from "@/components/icons";
import { MagneticButton, StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { GATEAU_NOTE } from "@/data/formules";
import { hrefActivite } from "@/data/activites";
import { euros } from "@/lib/tarification";
import type { FormuleVue } from "@/lib/vues";

/**
 * Les formules d'anniversaire, sur la page d'accueil.
 *
 * DEUX DISPOSITIONS, ET LE CHOIX N'EST PAS COSMÉTIQUE.
 *
 * Sur ordinateur, les formules sont côte à côte. C'est ce qu'on veut d'un
 * comparatif : on lit deux prix et deux listes d'un seul regard, et la
 * différence saute aux yeux.
 *
 * Sur téléphone, la même grille les empilait. Or une carte de formule fait
 * environ 600 px : la seconde commençait donc bien en dessous de la ligne de
 * flottaison, et on ne pouvait plus comparer — il fallait mémoriser la première
 * en descendant vers la seconde, ce que personne ne fait. Deux onglets mettent
 * les deux noms et les deux prix côte à côte en permanence, et la carte change
 * sous eux d'un geste.
 *
 * LES ONGLETS VIENNENT DE LA BASE, PAS D'UNE LISTE ÉCRITE ICI. « Kick-Off » et
 * « Bubble » sont les noms d'aujourd'hui ; Brahim les renomme, en désactive ou
 * en ajoute depuis /admin/tarifs. Des onglets codés en dur auraient menti dès
 * le premier changement — c'est exactement la faute déjà corrigée sur la carte
 * « Anniversaire » du hero, qui promettait « deux formules, Kick-Off et
 * Bubble » sans jamais consulter la table.
 *
 * AVEC UNE SEULE FORMULE, IL N'Y A PAS D'ONGLET. Un onglet unique est un
 * bouton qui ne fait rien : il occupe une ligne et apprend que le choix
 * n'existe pas. La carte s'affiche alors seule.
 *
 * LES DEUX RENDUS COEXISTENT DANS LE DOCUMENT, départagés par `display`. Un
 * `matchMedia` en JavaScript aurait évité la duplication, mais au prix d'un
 * rendu serveur qui ne sait pas quelle largeur il sert : la page prérendue
 * aurait choisi au hasard, puis changé sous les yeux du visiteur. `display:
 * none` retire par ailleurs une branche entière de l'arbre d'accessibilité,
 * donc rien n'est annoncé deux fois.
 */
export function FormulesAnniversaire({ formules }: { formules: FormuleVue[] }) {
  return (
    <>
      {/* ── Ordinateur : les formules côte à côte ── */}
      <StaggerContainer className="mt-10 hidden gap-6 md:grid md:grid-cols-2" staggerDelay={0.12}>
        {formules.map((f) => (
          <StaggerItem key={f.id} className="h-full">
            <Tilt3D intensity={6} className="h-full">
              <CarteFormule f={f} />
            </Tilt3D>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* ── Téléphone : un onglet par formule ── */}
      <div className="mt-8 md:hidden">
        <OngletsFormules formules={formules} />
      </div>
    </>
  );
}

function OngletsFormules({ formules }: { formules: FormuleVue[] }) {
  const [actif, setActif] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  if (formules.length === 0) return null;
  if (formules.length === 1) return <CarteFormule f={formules[0]} />;

  const choisie = formules[Math.min(actif, formules.length - 1)];

  /*
    LES FLÈCHES DÉPLACENT LA SÉLECTION, ET C'EST CE QUI FAIT D'UNE RANGÉE DE
    BOUTONS DES ONGLETS.

    Le motif « tabs » attend que Gauche et Droite changent d'onglet, et que la
    tabulation traverse le groupe d'un seul coup — d'où `tabIndex={-1}` sur les
    onglets non sélectionnés. Sans cela, un utilisateur au clavier doit tabuler
    autant de fois qu'il y a de formules pour atteindre le contenu, et les
    flèches ne font rien alors que le rôle annoncé les promet.
  */
  const auClavier = (e: React.KeyboardEvent, i: number) => {
    const suivant =
      e.key === "ArrowRight" ? (i + 1) % formules.length
      : e.key === "ArrowLeft" ? (i - 1 + formules.length) % formules.length
      : e.key === "Home" ? 0
      : e.key === "End" ? formules.length - 1
      : null;
    if (suivant === null) return;
    e.preventDefault();
    setActif(suivant);
    refs.current[suivant]?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label="Formules d'anniversaire" className="flex gap-2">
        {formules.map((f, i) => {
          const selectionne = i === actif;
          return (
            <button
              key={f.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`${base}-onglet-${i}`}
              aria-selected={selectionne}
              aria-controls={`${base}-panneau-${i}`}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => setActif(i)}
              onKeyDown={(e) => auClavier(e, i)}
              /*
                `min-h-12` : la cible tactile dépasse largement les 24 px du
                critère 2.5.8 du WCAG 2.2, et reste confortable au pouce.

                L'onglet sélectionné ne se distingue PAS que par la couleur — il
                porte aussi une bordure pleine et un fond, ce que le critère
                1.4.1 demande : une information ne doit jamais tenir à la seule
                couleur.
              */
              className={`flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl border px-3 py-2 transition-colors duration-300 ${
                selectionne
                  ? "border-field bg-field/15 text-foreground"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground"
              }`}
            >
              <span className="text-sm font-bold leading-tight">{f.nom}</span>
              <span
                className={`text-xs font-semibold ${selectionne ? "text-field" : "text-muted-foreground"}`}
              >
                {euros(f.prixBase)}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        `key` sur le panneau : sans elle, React réutilise le même nœud d'une
        formule à l'autre et le changement est INSTANTANÉ — on doute d'avoir
        cliqué. Avec elle, l'ancien panneau est démonté et le nouveau monté,
        donc l'animation d'entrée rejoue à chaque choix.

        Par `motion` et non par une keyframe CSS : le `MotionConfig
        reducedMotion="user"` de la coquille du site respecte déjà le réglage
        système, là où une animation CSS aurait demandé d'être ajoutée à la main
        au bloc `prefers-reduced-motion` de globals.css — et une liste à tenir à
        jour ailleurs finit toujours par oublier une entrée.

        `tabIndex={0}` : le panneau contient une liste défilante de contenu ; le
        motif « tabs » demande qu'il soit atteignable au clavier pour qu'on
        puisse le parcourir sans passer par ses liens.
      */}
      <motion.div
        key={choisie.id}
        role="tabpanel"
        id={`${base}-panneau-${actif}`}
        aria-labelledby={`${base}-onglet-${actif}`}
        tabIndex={0}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-4"
      >
        <CarteFormule f={choisie} />
      </motion.div>
    </>
  );
}

function CarteFormule({ f }: { f: FormuleVue }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition-colors duration-500 hover:border-field/40">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold">{f.nom}</h3>
        {/*
          Espace insécable avant le « € » : c'est la typographie française, et
          c'est surtout ce qu'affichent déjà le hero (« Dès 180 € ») et tout le
          tunnel de réservation, qui passent par `montantLisible()`.
        */}
        <p className="whitespace-nowrap font-[family-name:var(--font-heading)] text-3xl font-bold text-field">
          {euros(f.prixBase)}
        </p>
      </div>
      <p className="mt-1 text-sm font-medium text-kick">{f.accroche}</p>
      <p className="mt-3 leading-relaxed text-muted-foreground">{f.description}</p>

      <p className="mt-4 text-sm text-muted-foreground">
        Jusqu&apos;à <strong className="text-foreground">{f.enfantsInclus} enfants</strong>
        {" · "}+{euros(f.prixEnfantSup)} par enfant supplémentaire
      </p>

      <ul className="mt-5 flex-1 space-y-2">
        {f.inclus.map((inc) => (
          <li key={inc} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Coche className="mt-0.5 size-4 shrink-0 text-field" />
            {inc}
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Gateau className="mt-0.5 size-3.5 shrink-0 text-kick" /> {GATEAU_NOTE}
      </p>

      {/*
        Sur téléphone, le bouton portait « Réserver la formule Kick-Off » sur
        deux lignes alignées à gauche, la flèche restant seule au milieu de la
        hauteur, très à droite : le libellé et son signe ne se lisaient plus
        ensemble. Il occupe désormais toute la largeur de la carte, centré, et
        sa hauteur s'adapte au repli du texte (`min-h` et non `h`, sinon la
        deuxième ligne déborde du fond).
      */}
      <MagneticButton className="mt-6 block sm:inline-block">
        <Link
          href={hrefActivite("anniversaire")}
          className="btn-glass-field flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-sm font-semibold text-[#0a0a0b] sm:w-auto sm:px-6 sm:text-base"
        >
          Réserver la formule {f.nom} <FlecheDroite className="size-4 shrink-0" />
        </Link>
      </MagneticButton>
    </div>
  );
}
