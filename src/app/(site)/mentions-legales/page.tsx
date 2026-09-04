import type { Metadata } from "next";
import {
  NOM_COMMERCIAL, DENOMINATION_SOCIALE, SIEGE_SOCIAL, BCE, TVA,
  RESPONSABLE_PUBLICATION, ADRESSE, EMAIL, TELEPHONE, TELEPHONE_TEL,
  MAJ_LEGALE, ouACompleter,
} from "@/data/entreprise";

export const metadata: Metadata = {
  title: `Mentions légales | ${NOM_COMMERCIAL}`,
  description: `Mentions légales du site ${NOM_COMMERCIAL}.`,
};

const ACTIVITES = [
  "location de terrains de football indoor",
  "anniversaires",
  "Bubble Foot",
  "animations",
  "événements",
  "stages et entraînements",
  "activités liées au football et aux loisirs sportifs",
];

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {MAJ_LEGALE}</p>
      <h1 className="text-3xl font-bold">Mentions légales</h1>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Éditeur du site</h2>
        <p className="text-muted-foreground">Le présent site internet est édité par :</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Dénomination sociale :</strong> {ouACompleter(DENOMINATION_SOCIALE)}</li>
          <li><strong>Nom commercial :</strong> {NOM_COMMERCIAL}</li>
          <li>
            <strong>Adresse d&apos;exploitation :</strong> {ADRESSE.rue}, {ADRESSE.codePostal} {ADRESSE.ville}, {ADRESSE.pays}
          </li>
          <li><strong>Siège social :</strong> {ouACompleter(SIEGE_SOCIAL, "à compléter si différent")}</li>
          <li><strong>N° d&apos;entreprise (BCE) :</strong> {ouACompleter(BCE)}</li>
          <li><strong>N° de TVA :</strong> BE {ouACompleter(TVA)}</li>
          <li><strong>E-mail :</strong> <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a></li>
          <li><strong>Téléphone :</strong> <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a></li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Responsable de publication</h2>
        <p className="text-muted-foreground">
          Responsable de publication : {ouACompleter(RESPONSABLE_PUBLICATION, "nom ou fonction à compléter")}
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Activité</h2>
        <p className="text-muted-foreground">
          {NOM_COMMERCIAL} exploite un centre de football indoor à {ADRESSE.ville} et propose notamment :
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          {ACTIVITES.map((a) => <li key={a}>{a} ;</li>)}
        </ul>
        <p className="text-muted-foreground">
          Les caractéristiques, disponibilités et tarifs des prestations sont indiqués sur le site
          ou communiqués au client avant la réservation.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          Le contenu du site {NOM_COMMERCIAL}, notamment les textes, logos, éléments graphiques,
          photographies, vidéos, illustrations et éléments de mise en page appartenant à Offside,
          est protégé par les règles applicables en matière de propriété intellectuelle.
        </p>
        <p className="text-muted-foreground">
          Sauf autorisation préalable ou exception prévue par la loi, leur reproduction, adaptation,
          diffusion ou exploitation à des fins commerciales est interdite.
        </p>
        <p className="text-muted-foreground">
          Les marques, logos, photographies ou contenus appartenant à des partenaires ou à des tiers
          restent la propriété de leurs titulaires respectifs.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Informations disponibles sur le site</h2>
        <p className="text-muted-foreground">
          Offside veille à fournir des informations aussi exactes et actualisées que possible.
          Les horaires, prix, disponibilités, activités et contenus proposés peuvent évoluer.
        </p>
        <p className="text-muted-foreground">
          Pour toute prestation réservée, les informations contractuelles communiquées lors de la
          réservation et dans la confirmation de réservation prévalent sur les informations
          générales qui auraient été modifiées ultérieurement sur le site.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Liens externes</h2>
        <p className="text-muted-foreground">
          Le site peut contenir des liens vers des sites internet ou services exploités par des tiers.
          Offside n&apos;exerce pas de contrôle permanent sur ces sites externes et ne peut être tenu
          responsable de leur contenu ou de leur fonctionnement lorsque ceux-ci échappent à son contrôle.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Protection des données</h2>
        <p className="text-muted-foreground">
          Les informations relatives au traitement des données personnelles des utilisateurs et
          clients sont disponibles dans la{" "}
          <a href="/confidentialite" className="underline text-primary">Politique de confidentialité</a> du site.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Cookies</h2>
        <p className="text-muted-foreground">
          Le site peut utiliser des cookies et technologies similaires nécessaires à son
          fonctionnement ainsi que, sous réserve du consentement de l&apos;utilisateur lorsque
          celui-ci est requis, des cookies de mesure d&apos;audience, de personnalisation ou liés
          à des services tiers.
        </p>
        <p className="text-muted-foreground">
          Les utilisateurs disposent d&apos;un{" "}
          <a href="/politique-cookies" className="underline text-primary">outil leur permettant de gérer leurs préférences</a>{" "}
          lorsque le consentement est requis.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative au site internet ou aux présentes mentions légales :
        </p>
        <address className="not-italic text-muted-foreground">
          {NOM_COMMERCIAL}<br />
          {ADRESSE.rue}<br />
          {ADRESSE.codePostal} {ADRESSE.ville}<br />
          {ADRESSE.pays}<br />
          E-mail : <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a><br />
          Téléphone : <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a>
        </address>
      </section>
    </div>
  );
}
