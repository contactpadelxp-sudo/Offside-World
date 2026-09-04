import type { Metadata } from "next";

/**
 * Coquille du back-office.
 *
 * Volontairement nue : ni en-tête, ni pied de page, ni bandeau cookies. Aucune
 * navigation du site public n'existe ici, et rien sur le site public ne pointe
 * vers `/admin`. Les deux univers ne se croisent qu'au niveau du gabarit racine,
 * qui ne porte que les polices et la feuille de style.
 *
 * Conséquence recherchée : on n'arrive pas ici par une fausse manœuvre, et on
 * n'en sort pas non plus par un retour arrière malheureux vers un écran de
 * réservation.
 */
export const metadata: Metadata = {
  title: "Back-office — Offside Foot Indoor",
  robots: { index: false, follow: false, nocache: true },
};

export default function CoquilleAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-full flex-1 flex-col bg-background">{children}</div>;
}
