import type { Metadata } from "next";
import { NOM_COMMERCIAL } from "@/data/entreprise";

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
 *
 * `back-office` porte la palette de l'outil de travail — plus claire que celle
 * de la vitrine, et surtout avec des cartes qui se détachent du fond. Elle est
 * posée ici, sur la coquille : tout ce qui est sous `/admin` en hérite, et rien
 * du site public n'y touche. Voir le bloc `.back-office` dans `globals.css`
 * pour les mesures de contraste.
 */
export const metadata: Metadata = {
  title: `Back-office — ${NOM_COMMERCIAL}`,
  robots: { index: false, follow: false, nocache: true },
};

export default function CoquilleAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="back-office flex min-h-full flex-1 flex-col bg-background">{children}</div>
  );
}
