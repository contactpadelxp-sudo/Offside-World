import type { Metadata } from "next";
import {
  NOM_COMMERCIAL, DENOMINATION_SOCIALE, BCE, ADRESSE, ADRESSE_LIGNE,
  EMAIL, TELEPHONE, TELEPHONE_TEL, MAJ_LEGALE, ouACompleter,
} from "@/data/entreprise";

export const metadata: Metadata = {
  title: `Politique de confidentialité | ${NOM_COMMERCIAL}`,
  description: `Comment ${NOM_COMMERCIAL} collecte et traite vos données personnelles.`,
};

function Article({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-xl font-bold">{n}. {titre}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground">{children}</p>
);

const SousTitre = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-semibold pt-2">{children}</h3>
);

const Liste = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {MAJ_LEGALE}</p>
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mt-2 text-muted-foreground">{NOM_COMMERCIAL}</p>
      <p className="mt-4 text-muted-foreground">
        La présente Politique de confidentialité explique comment {NOM_COMMERCIAL} collecte et
        traite les données personnelles de ses clients, participants et visiteurs de son site internet.
      </p>

      <Article n={1} titre="Responsable du traitement">
        <P>Le responsable du traitement est :</P>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>{ouACompleter(DENOMINATION_SOCIALE, "dénomination sociale à compléter")}</strong></li>
          <li><strong>Nom commercial :</strong> {NOM_COMMERCIAL}</li>
          <li><strong>Adresse :</strong> {ADRESSE_LIGNE}</li>
          <li><strong>N° d&apos;entreprise :</strong> {ouACompleter(BCE)}</li>
          <li>
            <strong>E-mail relatif à la vie privée :</strong>{" "}
            <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a>
          </li>
          <li>
            <strong>Téléphone :</strong>{" "}
            <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a>
          </li>
        </ul>
      </Article>

      <Article n={2} titre="Quelles données pouvons-nous traiter ?">
        <P>
          Selon votre utilisation du site et des services Offside, nous pouvons notamment traiter
          les catégories de données suivantes.
        </P>

        <SousTitre>Données d&apos;identification et de contact</SousTitre>
        <Liste items={[
          "nom ;", "prénom ;", "adresse e-mail ;", "numéro de téléphone ;",
          "éventuellement adresse de facturation ;",
          "informations communiquées dans un formulaire de contact.",
        ]} />

        <SousTitre>Données liées aux réservations</SousTitre>
        <Liste items={[
          "date et heure de la réservation ;", "prestation choisie ;", "nombre de participants ;",
          "informations relatives à un anniversaire, stage ou événement ;",
          "informations nécessaires à la bonne organisation de l'activité ;",
          "historique des réservations.",
        ]} />

        <SousTitre>Données relatives aux participants</SousTitre>
        <P>
          Lorsque cela est nécessaire pour l&apos;organisation d&apos;une activité, certaines
          informations concernant les participants peuvent être traitées, notamment leur nom, leur
          tranche d&apos;âge ou les informations nécessaires à leur participation.
        </P>
        <P>Nous évitons de collecter des données sensibles lorsqu&apos;elles ne sont pas nécessaires.</P>

        <SousTitre>Données de paiement et de facturation</SousTitre>
        <P>Offside peut traiter :</P>
        <Liste items={[
          "montant payé ;", "statut du paiement ;", "informations de facturation ;",
          "références de transaction.",
        ]} />
        <P>
          Lorsque le paiement est effectué par l&apos;intermédiaire d&apos;un prestataire de
          paiement externe, les données bancaires ou de carte peuvent être traitées directement par
          ce prestataire. Offside ne reçoit pas nécessairement les données complètes de la carte
          bancaire.
        </P>

        <SousTitre>Images et vidéos</SousTitre>
        <P>
          Les installations Offside peuvent être équipées de caméras utilisées notamment pour les
          fonctionnalités de replay ou de vidéo souvenir annoncées dans certaines prestations.
          Ces images peuvent permettre l&apos;identification de participants.
        </P>
        <P>
          Les images réalisées pour une fonctionnalité de jeu ou de souvenir ne sont pas
          automatiquement utilisées à des fins publicitaires. L&apos;utilisation identifiable
          d&apos;une photographie ou d&apos;une vidéo à des fins promotionnelles fait l&apos;objet
          d&apos;une base juridique appropriée et, lorsque la loi l&apos;exige, d&apos;un
          consentement distinct.
        </P>
        <P>Une attention particulière est accordée aux images de mineurs.</P>

        <SousTitre>Données techniques</SousTitre>
        <P>
          Lors de la consultation du site, certaines informations techniques peuvent être traitées,
          par exemple :
        </P>
        <Liste items={[
          "adresse IP ;", "type de navigateur ;", "type d'appareil ;", "système d'exploitation ;",
          "date et heure de connexion ;", "pages consultées ;",
          "informations liées aux cookies et technologies similaires.",
        ]} />
      </Article>

      <Article n={3} titre="Pourquoi utilisons-nous vos données ?">
        <P>Nous pouvons traiter vos données pour les finalités suivantes.</P>

        <SousTitre>Gérer vos réservations et fournir nos services</SousTitre>
        <P>Cela comprend notamment :</P>
        <Liste items={[
          "enregistrer une réservation ;", "confirmer un créneau ;", "organiser une activité ;",
          "communiquer avec le client ;", "gérer les participants ;",
          "fournir une vidéo souvenir lorsque celle-ci est prévue ;",
          "traiter une modification ou une annulation.",
        ]} />
        <P>
          La base juridique est principalement l&apos;exécution du contrat ou les démarches
          précontractuelles demandées par le client.
        </P>

        <SousTitre>Gérer les paiements et la comptabilité</SousTitre>
        <P>
          Nous traitons les informations nécessaires à la facturation, aux paiements, à la
          comptabilité et au respect de nos obligations fiscales et légales. La base juridique est
          l&apos;exécution du contrat ainsi que le respect de nos obligations légales.
        </P>

        <SousTitre>Répondre aux demandes</SousTitre>
        <P>
          Lorsque vous nous contactez par e-mail, téléphone ou formulaire, nous utilisons les
          informations communiquées pour répondre à votre demande. Selon la nature de celle-ci, le
          traitement repose sur les démarches précontractuelles demandées par vous ou sur notre
          intérêt légitime à assurer le suivi des demandes reçues.
        </P>

        <SousTitre>Sécurité et protection de nos droits</SousTitre>
        <P>Certaines données peuvent être utilisées lorsqu&apos;elles sont nécessaires pour :</P>
        <Liste items={[
          "assurer la sécurité des installations et des systèmes informatiques ;",
          "prévenir les abus ou fraudes ;", "constater un incident ;",
          "gérer une réclamation ou un litige ;",
          "défendre les droits d'Offside ou d'une personne concernée.",
        ]} />
        <P>
          Le traitement repose, selon les circonstances, sur une obligation légale ou sur notre
          intérêt légitime, après prise en compte des droits et libertés des personnes concernées.
        </P>

        <SousTitre>Communication commerciale</SousTitre>
        <P>
          Nous pouvons envoyer des informations commerciales aux personnes ayant valablement accepté
          de les recevoir ou lorsque la législation nous permet de le faire.
        </P>
        <P>
          Lorsqu&apos;un traitement repose sur votre consentement, vous pouvez le retirer à tout
          moment. Vous pouvez également vous opposer à l&apos;utilisation de vos données à des fins
          de marketing direct.
        </P>
      </Article>

      <Article n={4} titre="Cookies et technologies similaires">
        <P>Le site utilise ou peut utiliser des cookies et technologies similaires.</P>

        <SousTitre>Cookies strictement nécessaires</SousTitre>
        <P>
          Ces cookies sont indispensables au fonctionnement du site ou à la fourniture d&apos;un
          service expressément demandé par l&apos;utilisateur. Ils peuvent notamment servir à :
        </P>
        <Liste items={[
          "sécuriser le site ;", "maintenir une session ;",
          "mémoriser les choix relatifs aux cookies ;",
          "faire fonctionner un formulaire ou un processus de réservation.",
        ]} />
        <P>
          Ils ne nécessitent pas nécessairement le consentement préalable de l&apos;utilisateur
          lorsque les conditions légales sont remplies.
        </P>

        <SousTitre>Cookies non nécessaires</SousTitre>
        <P>D&apos;autres cookies peuvent notamment servir à :</P>
        <Liste items={[
          "mesurer l'audience ;", "analyser la navigation ;", "intégrer des contenus externes ;",
          "personnaliser l'expérience ;", "mesurer l'efficacité d'une campagne publicitaire ;",
          "permettre certaines fonctionnalités de réseaux sociaux.",
        ]} />
        <P>
          Lorsqu&apos;un consentement est légalement requis, ces cookies ne sont activés
          qu&apos;après le choix positif de l&apos;utilisateur. Refuser les cookies non nécessaires
          ne doit pas empêcher l&apos;accès normal au site.
        </P>
        <P>
          L&apos;utilisateur doit pouvoir retirer son consentement ou modifier ses préférences aussi
          facilement qu&apos;il les a données. La liste précise des cookies utilisés, leur
          fournisseur, leur finalité et leur durée est reprise dans la{" "}
          <a href="/politique-cookies" className="underline text-primary">politique de gestion des cookies</a> du site.
        </P>
      </Article>

      <Article n={5} titre="Avec qui partageons-nous vos données ?">
        <P>Offside ne vend pas les données personnelles de ses clients.</P>
        <P>
          Certaines données peuvent toutefois être accessibles à des prestataires lorsque cela est
          nécessaire au fonctionnement de nos services, par exemple :
        </P>
        <Liste items={[
          "hébergeur et prestataire du site internet ;", "système de réservation ;",
          "prestataire de paiement ;", "prestataire informatique ;", "outil d'envoi d'e-mails ;",
          "prestataire comptable ;",
          "partenaires intervenant directement dans l'organisation d'une activité lorsque cela est nécessaire.",
        ]} />
        <P>
          Ces prestataires ne peuvent traiter les données que dans le cadre de leurs missions et
          conformément aux règles applicables.
        </P>
        <P>
          Les données peuvent également être communiquées lorsqu&apos;une obligation légale nous
          l&apos;impose ou lorsqu&apos;une autorité légalement habilitée en fait la demande.
        </P>
      </Article>

      <Article n={6} titre="Transferts en dehors de l'Espace économique européen">
        <P>
          Certains prestataires numériques peuvent traiter des données depuis des pays situés en
          dehors de l&apos;Espace économique européen.
        </P>
        <P>
          Lorsqu&apos;un tel transfert a lieu, Offside veille à ce qu&apos;il repose sur un
          mécanisme prévu par le RGPD, notamment une décision d&apos;adéquation ou des garanties
          contractuelles appropriées lorsqu&apos;elles sont requises.
        </P>
        <P>Les informations spécifiques dépendent des prestataires effectivement utilisés par le site.</P>
      </Article>

      <Article n={7} titre="Combien de temps conservons-nous les données ?">
        <P>
          Nous ne conservons les données personnelles que pendant la période nécessaire à la
          finalité pour laquelle elles ont été collectées, sous réserve des obligations légales
          applicables. À titre général :
        </P>
        <Liste items={[
          "Données de réservation et de relation client : pendant la durée nécessaire à la gestion de la réservation et ensuite pendant la période raisonnablement nécessaire à la gestion des réclamations ou litiges éventuels.",
          "Documents comptables et factures : pendant la durée de conservation légalement applicable, qui peut atteindre 10 ans en Belgique.",
          "Demandes de contact sans réservation : le temps nécessaire pour répondre à la demande, puis pendant une durée limitée permettant d'en assurer le suivi.",
          "Données utilisées pour le marketing avec consentement : jusqu'au retrait du consentement ou jusqu'à ce que les données ne soient plus nécessaires à cette finalité.",
          "Images et vidéos Replay : pendant la durée nécessaire à la fourniture de la fonctionnalité ou du souvenir annoncé. Offside veille à ne pas les conserver indéfiniment sans justification.",
          "Cookies : selon la durée propre à chaque cookie indiquée dans l'outil ou la politique de gestion des cookies.",
        ]} />
        <P>
          En cas de litige, certaines informations peuvent être conservées plus longtemps dans la
          mesure nécessaire à la constatation, l&apos;exercice ou la défense d&apos;un droit en justice.
        </P>
      </Article>

      <Article n={8} titre="Vos droits">
        <P>Dans les conditions prévues par le RGPD, vous pouvez notamment demander :</P>
        <Liste items={[
          "l'accès à vos données personnelles ;", "la rectification de données inexactes ;",
          "l'effacement de certaines données ;", "la limitation d'un traitement ;",
          "la portabilité de certaines données ;", "l'opposition à certains traitements ;",
          "l'arrêt de l'utilisation de vos données pour le marketing direct.",
        ]} />
        <P>
          Lorsque le traitement repose sur votre consentement, vous pouvez retirer ce consentement à
          tout moment. Le retrait du consentement n&apos;affecte pas la légalité des traitements
          réalisés avant ce retrait.
        </P>
        <P>
          Pour exercer vos droits, vous pouvez contacter{" "}
          <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a>.
        </P>
        <P>
          Afin d&apos;éviter de transmettre des données à une personne non autorisée, nous pouvons
          demander les informations raisonnablement nécessaires pour vérifier votre identité.
        </P>
      </Article>

      <Article n={9} titre="Droit de déposer une plainte">
        <P>
          Si vous estimez que vos données personnelles ne sont pas traitées conformément à la
          réglementation, vous pouvez introduire une plainte auprès de l&apos;autorité belge
          compétente en matière de protection des données :{" "}
          <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            Autorité de protection des données — Belgique
          </a>.
        </P>
        <P>
          Vous pouvez également nous contacter préalablement à l&apos;adresse{" "}
          <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a>{" "}
          afin que nous puissions examiner votre demande.
        </P>
      </Article>

      <Article n={10} titre="Données concernant les mineurs">
        <P>
          Une partie importante des activités proposées par Offside peut concerner des enfants.
          Nous accordons par conséquent une attention particulière à la protection de leurs données.
        </P>
        <P>
          Lorsqu&apos;une autorisation parentale est légalement nécessaire, notamment pour certaines
          utilisations d&apos;images ou de données, Offside veille à obtenir l&apos;autorisation
          appropriée avant l&apos;utilisation concernée.
        </P>
        <P>
          Les informations concernant les mineurs ne sont collectées que lorsqu&apos;elles sont
          utiles ou nécessaires à l&apos;activité concernée.
        </P>
      </Article>

      <Article n={11} titre="Sécurité">
        <P>
          Offside prend des mesures techniques et organisationnelles raisonnables afin de protéger
          les données personnelles contre notamment :
        </P>
        <Liste items={[
          "l'accès non autorisé ;", "la perte ;", "l'altération ;",
          "la divulgation injustifiée ;", "l'utilisation abusive.",
        ]} />
        <P>
          L&apos;accès aux données est limité aux personnes et prestataires qui en ont besoin dans
          le cadre de leurs missions.
        </P>
      </Article>

      <Article n={12} titre="Modification de cette politique">
        <P>La présente Politique de confidentialité peut être adaptée afin de tenir compte :</P>
        <Liste items={[
          "d'une modification de nos services ;", "d'un changement de prestataire ;",
          "d'une évolution technologique ;", "d'une modification légale ou réglementaire.",
        ]} />
        <P>La date de la dernière mise à jour est indiquée en haut de cette page.</P>
      </Article>

      <Article n={13} titre="Contact">
        <P>Pour toute question concernant vos données personnelles :</P>
        <address className="not-italic text-muted-foreground">
          {NOM_COMMERCIAL}<br />
          {ADRESSE.rue}<br />
          {ADRESSE.codePostal} {ADRESSE.ville}<br />
          {ADRESSE.pays}<br />
          E-mail : <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a><br />
          Téléphone : <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a>
        </address>
      </Article>
    </div>
  );
}
