"use client";

/** BANC D'ESSAI TEMPORAIRE — revue du back-office. À supprimer après. */

import { useState } from "react";
import { BarreAdmin } from "@/components/admin/barre";
import { FicheReservation } from "@/components/admin/fiche-reservation";
import { FicheDevis } from "@/components/admin/fiche-devis";
import { FicheFormule, FicheOption } from "@/components/admin/fiche-tarif";
import { ListeCreneaux, OuvrirPeriode } from "@/components/admin/actions-creneaux";
import { OngletsFiltres } from "@/components/admin/onglets";
import { Recherche } from "@/components/admin/recherche";
import { FormulaireArticle } from "@/components/admin/formulaire-article";
import { TestEmail } from "@/components/admin/test-email";
import type { ReservationAdmin } from "@/lib/vues";

const resa: ReservationAdmin = {
  id: "1",
  reference: "ANN-2XD5YCL7",
  type: "anniversaire",
  statut: "confirmee",
  total: 200,
  formuleNom: "Kick-Off",
  nbEnfants: 12,
  enfantPrenom: "Jean-Baptiste",
  enfantAge: 9,
  nbPersonnes: null,
  options: ["Photographe professionnel", "Piñata garnie"],
  clientNom: "Marie-Christine Vandenbroucke",
  clientEmail: "marie-christine.vandenbroucke@exemple-tres-long.be",
  clientTelephone: "+32 470 12 34 56",
  allergies: "Allergie aux arachides et aux fruits à coque",
  remarques: "Merci de prévoir une table supplémentaire pour le gâteau.",
  noteInterne: "Rappeler la maman la veille — elle vient de loin.",
  jour: "2026-10-15",
  jourLabel: "Jeudi 15 octobre 2026",
  debut: "15:00",
  fin: "17:00",
  espaceNom: "Espace anniversaire 2",
  passee: false,
  paiement: { montantCents: 20000, rembourseCents: 0, baremeCents: 20000 },
};

const devis = {
  id: "d1",
  reference: "TB-RGFRXS39",
  entreprise: "Ateliers Verhoeven & Associés SRL",
  contactNom: "Sophie Verhoeven-Delcourt",
  contactEmail: "sophie.verhoeven@ateliers-verhoeven.be",
  contactTelephone: "+32 470 00 00 00",
  dateSouhaitee: "Jeudi 15 octobre 2026",
  periode: "Après-midi",
  nbParticipants: 42,
  message: "Nous sommes 42, idéalement l'après-midi. Prévoir un espace pour le buffet.",
  noteInterne: null,
  statut: "nouvelle" as const,
  recuLe: "12 septembre 2026",
  devis: { lignes: [], message: "", validite: "", envoyeLe: null, tvaPourcent: null },
  client: { adresse: "", tva: "" },
  brut: { dateSouhaitee: "Jeudi 15 octobre 2026", periode: "l'après-midi", nbParticipants: 42 },
};

const creneaux = [
  {
    id: "c1", type: "anniversaire" as const, espaceNom: "Espace anniversaire 2",
    jour: "2026-10-15", jourLabel: "Jeudi 15 octobre 2026", debut: "15:00", fin: "17:00",
    ouvert: true, reservePar: "ANN-2XD5YCL7",
  },
  {
    id: "c2", type: "bubble" as const, espaceNom: "Terrain 1 — Bubble Foot",
    jour: "2026-10-15", jourLabel: "Jeudi 15 octobre 2026", debut: "17:30", fin: "19:00",
    ouvert: false, reservePar: null,
  },
];

const formule = {
  id: "f1", nom: "Bubble", accroche: "Je veux l'expérience la plus fun",
  description: "L'anniversaire Offside dans sa version la plus fun ! Football Indoor et Bubble Foot.",
  prixBase: 290, enfantsInclus: 10, prixEnfantSup: 15, enfantsMax: 20, dureeMinutes: 120,
  inclus: ["1 heure de Bubble Foot", "Animateur dédié", "Vidéo souvenir"],
  actif: true,
};

const option = {
  id: "o1", libelle: "Photographe professionnel",
  description: "Reportage photo complet, livré sous 48 heures.", prix: 145, actif: true,
};

const article = {
  id: "a1",
  slug: "anniversaire-foot-indoor-gembloux",
  titre: "Organiser un anniversaire foot indoor à Gembloux",
  chapo: "Entre la salle, le goûter et les jeux, un anniversaire demande de l'organisation.",
  image: null,
  publie: true,
  publieLe: "12 septembre 2026",
  modifieLe: "13 septembre 2026",
  corps: "<h2>Choisir le créneau</h2><p>Les samedis après-midi partent en premier.</p>",
};

function Ecran({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 rounded bg-white/5 px-2 py-1 text-xs font-bold uppercase tracking-widest text-field">
        {titre}
      </h2>
      {children}
    </section>
  );
}

export default function LaboBo() {
  const [, setHtml] = useState(article.corps);
  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-20">
      <h1 className="text-2xl font-bold">Back-office — tous les écrans</h1>

      <Ecran titre="Navigation">
        <div className="-mx-4 overflow-hidden rounded-xl border border-border">
          <BarreAdmin acteur="brahim" aConfirmer={3} devisNouveaux={12} />
        </div>
      </Ecran>

      <Ecran titre="Réservations — filtres, recherche, fiche">
        <OngletsFiltres
          filtres={[
            { valeur: "a-venir", label: "À venir" },
            { valeur: "a-confirmer", label: "À confirmer" },
            { valeur: "passees", label: "Passées" },
            { valeur: "annulees", label: "Annulées" },
          ]}
          actif="a-venir"
          desactives={false}
        />
        <div className="mt-3"><Recherche valeur="" /></div>
        <div className="mt-4 space-y-4">
          <FicheReservation r={{ ...resa, id: "a", statut: "en_attente", paiement: null }} />
          <FicheReservation r={resa} />
          <FicheReservation r={{ ...resa, id: "c", statut: "annulee",
            paiement: { montantCents: 20000, rembourseCents: 10000, baremeCents: 10000 } }} />
        </div>
      </Ecran>

      <Ecran titre="Devis">
        <FicheDevis d={devis} />
      </Ecran>

      <Ecran titre="Créneaux">
        <ListeCreneaux creneaux={creneaux} />
        <div className="mt-6"><OuvrirPeriode debutParDefaut="2026-09-15" finParDefaut="2027-03-14" /></div>
      </Ecran>

      <Ecran titre="Tarifs">
        <FicheFormule f={formule} />
        <div className="mt-4"><FicheOption o={option} /></div>
      </Ecran>

      <Ecran titre="Blog">
        <FormulaireArticle a={article} />
      </Ecran>

      <Ecran titre="Réglages — e-mail de test">
        <TestEmail adresseParDefaut="brahim@offsidefootindoor.be" />
      </Ecran>

      <button hidden onClick={() => setHtml(article.corps)} />
    </div>
  );
}
