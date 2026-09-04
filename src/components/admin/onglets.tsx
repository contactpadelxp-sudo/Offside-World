"use client";

import Link, { useLinkStatus } from "next/link";
import type { FiltreReservations } from "@/lib/vues";

/**
 * Onglets et liens de navigation interne du back-office.
 *
 * Chaque page du back-office est rendue à la demande : un clic déclenche un
 * aller-retour serveur. Le `loading.tsx` de chaque section affiche déjà une
 * ossature immédiate ; ce voyant couvre le court instant d'avant, quand la
 * navigation n'a pas encore commencé à s'afficher.
 *
 * Il est TOUJOURS rendu et ne fait varier que son opacité : un indicateur qui
 * apparaît et disparaît décalerait le texte à chaque clic.
 */

export function Voyant() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`size-1.5 shrink-0 rounded-full bg-current transition-opacity duration-150 ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function LienOnglet({
  href,
  actif,
  children,
  className = "",
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
        actif
          ? "bg-field/15 text-field ring-1 ring-field/40"
          : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground"
      } ${className}`}
    >
      {children}
      <Voyant />
    </Link>
  );
}

export function OngletsFiltres({
  filtres,
  actif,
  desactives,
}: {
  filtres: { valeur: FiltreReservations; label: string }[];
  actif: FiltreReservations;
  /** Vrai pendant une recherche : les filtres ne s'appliquent plus. */
  desactives: boolean;
}) {
  return (
    <nav className={`flex flex-wrap gap-2 ${desactives ? "opacity-50" : ""}`}>
      {filtres.map((f) => (
        <LienOnglet
          key={f.valeur}
          href={f.valeur === "a-venir" ? "/admin" : `/admin?filtre=${f.valeur}`}
          actif={!desactives && f.valeur === actif}
        >
          {f.label}
        </LienOnglet>
      ))}
    </nav>
  );
}
