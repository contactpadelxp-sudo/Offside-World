"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { seDeconnecter } from "@/lib/actions/session";
import { Voyant } from "@/components/admin/onglets";
import { Bouclier, Calendrier, Carte, Document, PressePapier, type IconType } from "@/components/icons";

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
  { href: "/admin/journal", label: "Journal", icone: Bouclier },
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
    <header className="sticky top-0 z-30 border-b border-border bg-[#0a0a0b]/95 backdrop-blur">
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

        <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
          {SECTIONS.map((s) => {
            const actif = s.href === "/admin" ? chemin === "/admin" : chemin.startsWith(s.href);
            const n = pastille(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={actif ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                  actif
                    ? "bg-field/15 text-field"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <s.icone className="size-4" />
                {s.label}
                {n > 0 && (
                  <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-kick px-1.5 text-[11px] font-bold text-[#0a0a0b]">
                    {n}
                  </span>
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
