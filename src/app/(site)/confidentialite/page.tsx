import type { Metadata } from "next";
import {
  NOM_COMMERCIAL, RAISON_SOCIALE, BCE, ADRESSE, ADRESSE_LIGNE,
  EMAIL, MAJ_LEGALE, ouACompleter,
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
    <div className="page-legale mx-auto max-w-4xl px-4 pt-32 pb-12 md:pb-20">
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
          <li><strong>{ouACompleter(RAISON_SOCIALE, "dénomination sociale à compléter")}</strong></li>
          <li><strong>Nom commercial :</strong> {NOM_COMMERCIAL}</li>
          <li><strong>Adresse :</strong> {ADRESSE_LIGNE}</li>
          <li><strong>N° d&apos;entreprise :</strong> {ouACompleter(BCE)}</li>
          <li>
            <strong>E-mail relatif à la vie privée :</strong>{" "}
            <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a>
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
          "informations communiquées dans le formulaire de demande de devis (nom de l'entreprise, numéro de TVA, adresse de facturation, message)."
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
          Lorsque vous nous contactez par e-mail, par téléphone ou via le formulaire de demande
          de devis, nous utilisons les informations communiquées pour répondre à votre demande. Selon la nature de celle-ci, le
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

      {/*
        CETTE SECTION DÉCRIVAIT DES COOKIES QUI N'EXISTENT PAS.

        « Intégrer des contenus externes », « personnaliser l'expérience »,
        « mesurer l'efficacité d'une campagne publicitaire », « fonctionnalités
        de réseaux sociaux » : rien de tout cela n'est déposé par ce site, et
        rien ne le sera sans qu'on réécrive cette page. C'était du texte de
        modèle, recopié tel quel.

        Ce n'est pas une exagération inoffensive. Une politique de
        confidentialité est une déclaration : annoncer des traceurs
        publicitaires qu'on n'a pas donne une image fausse du site — dans le
        mauvais sens — et, le jour où un visiteur demande quelles données de
        campagne on détient sur lui, la seule réponse honnête est qu'on lui a
        décrit un site qui n'est pas celui-ci.

        La liste ci-dessous ne contient donc que ce qui est réellement posé
        dans le navigateur, et elle doit être modifiée en même temps que le
        code qui le fait — pas après.
      */}
      <Article n={4} titre="Cookies et technologies similaires">
        <P>
          Le site n&apos;utilise que deux traceurs, tous deux internes. Aucun cookie publicitaire,
          aucun bouton de réseau social et aucun contenu externe déposant un traceur ne figure sur
          ce site.
        </P>

        <SousTitre>Strictement nécessaire — sans consentement</SousTitre>
        <P>
          Votre choix en matière de cookies est conservé dans votre navigateur pendant six mois,
          afin de ne pas vous reposer la question à chaque page. Cette information ne quitte jamais
          votre appareil.
        </P>

        <SousTitre>Mesure d&apos;audience — avec votre consentement</SousTitre>
        <P>
          Si vous l&apos;acceptez, nous comptons les pages consultées, la provenance, le type
          d&apos;appareil, le pays, la langue de votre navigateur et les étapes franchies dans le
          parcours de réservation. Le pays est déduit de votre adresse IP par notre hébergeur ;
          l&apos;adresse elle-même n&apos;est pas conservée. L&apos;outil est
          le nôtre : aucune donnée n&apos;est transmise à un tiers, aucune adresse IP n&apos;est
          conservée, et l&apos;identifiant de visite est tiré au hasard puis oublié après trente
          minutes, ce qui rend impossible le rapprochement de deux visites. Les statistiques sont
          effacées au bout de treize mois.
        </P>
        <P>
          Refuser la mesure d&apos;audience n&apos;empêche l&apos;accès à aucune partie du site.
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
          Les prestataires qui traitent des données pour notre compte sont les suivants. L&apos;article
          13.1.e du RGPD impose de les nommer : une liste de catégories ne permet pas de savoir qui
          détient réellement vos informations.
        </P>
        <Liste items={[
          "Supabase — base de données du site : réservations, demandes de devis, contenus. Données hébergées en Irlande (Union européenne).",
          "Resend — envoi des e-mails de confirmation, d'annulation et de remboursement. Données hébergées en Irlande (Union européenne).",
          "Vercel — hébergement du site. Les pages sont calculées sur des serveurs situés aux États-Unis (voir l'article 6).",
          "Stripe — paiement en ligne. Stripe Payments Europe Ltd, établie en Irlande, avec un traitement pouvant impliquer sa société mère aux États-Unis. Nous ne recevons ni ne conservons aucun numéro de carte : le paiement se déroule entièrement sur les pages de Stripe.",
          "Google (Google Workspace) — boîte aux lettres professionnelle du complexe, qui reçoit les avis de nouvelle réservation. Ces avis contiennent le nom du client et le détail de la prestation.",
          "Notre prestataire comptable, pour les pièces justificatives exigées par la loi.",
        ]} />
        <P>
          Ces prestataires ne peuvent traiter les données que sur nos instructions et dans le cadre
          de leurs missions.
        </P>
        <P>
          <strong>Sport-Finder</strong>, qui commercialise la location de terrain et le Bubble Foot,
          n&apos;est pas un prestataire du site : c&apos;est un service distinct. Lorsque vous suivez
          un lien vers Sport-Finder, vous quittez ce site et les données que vous y saisissez sont
          régies par la politique de confidentialité de ce service. Nous ne lui transmettons aucune
          donnée.
        </P>
        <P>
          Les données peuvent également être communiquées lorsqu&apos;une obligation légale nous
          l&apos;impose ou lorsqu&apos;une autorité légalement habilitée en fait la demande.
        </P>
      </Article>

      <Article n={6} titre="Transferts en dehors de l'Espace économique européen">
        <P>
          <strong>Oui, des transferts ont lieu</strong>, et il vaut mieux le dire que l&apos;écrire au
          conditionnel. La base de données et l&apos;envoi des e-mails restent dans l&apos;Union
          européenne, en Irlande. En revanche :
        </P>
        <Liste items={[
          "l'hébergement du site (Vercel) calcule les pages sur des serveurs situés aux États-Unis ; les données que vous saisissez dans un formulaire y transitent avant d'être enregistrées en Irlande ;",
          "le paiement (Stripe) et la messagerie professionnelle (Google) reposent sur des sociétés dont la maison mère est établie aux États-Unis.",
        ]} />
        <P>
          Ces transferts s&apos;appuient sur les mécanismes prévus au chapitre V du RGPD —
          clauses contractuelles types de la Commission européenne, et, le cas échéant, décision
          d&apos;adéquation applicable aux entreprises américaines certifiées. Vous pouvez nous
          demander une copie des garanties mises en place à l&apos;adresse indiquée à
          l&apos;article 1.
        </P>
      </Article>

      <Article n={7} titre="Combien de temps conservons-nous les données ?">
        <P>
          Nous ne conservons les données personnelles que pendant la période nécessaire à la
          finalité pour laquelle elles ont été collectées, sous réserve des obligations légales
          applicables. À titre général :
        </P>
        <Liste items={[
          "Données de réservation et de relation client : 13 mois, après quoi le nom, l'e-mail, le téléphone, le prénom et l'âge de la personne fêtée, les allergies signalées et les remarques sont effacés automatiquement. Le montant, la date et la prestation subsistent, pour la comptabilité.",
          "Documents comptables et factures : pendant la durée de conservation légalement applicable, qui peut atteindre 10 ans en Belgique.",
          "Demandes de devis : 13 mois, après quoi les coordonnées du contact et le contenu du message sont effacés automatiquement. Seuls le nom de l'entreprise, le montant et la date subsistent, pour la comptabilité.",
          "Données utilisées pour le marketing avec consentement : jusqu'au retrait du consentement ou jusqu'à ce que les données ne soient plus nécessaires à cette finalité.",
          "Images et vidéos Replay : pendant la durée nécessaire à la fourniture de la fonctionnalité ou du souvenir annoncé. Offside veille à ne pas les conserver indéfiniment sans justification.",
          "Statistiques de fréquentation : 13 mois, après quoi elles sont effacées automatiquement. L'identifiant de visite, lui, est oublié après 30 minutes.",
          "Choix en matière de cookies : 6 mois dans votre navigateur, après quoi la question vous est reposée.",
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
          <strong>Nous répondons dans un délai d&apos;un mois</strong> à compter de la réception de
          votre demande, comme le prévoit l&apos;article 12.3 du RGPD. Si votre demande est complexe,
          ce délai peut être prolongé de deux mois ; nous vous en informons alors dans le mois.
        </P>
        <P>
          Une demande d&apos;effacement portant sur une réservation passée est honorée directement :
          le nom, l&apos;e-mail, le téléphone, le prénom et l&apos;âge de la personne fêtée, les
          allergies, les remarques et les notes internes sont supprimés. Le montant, la date et la
          prestation subsistent, sans lien avec une personne : la loi nous impose de conserver les
          pièces comptables, et l&apos;article 17.3.b du RGPD réserve expressément ce cas.
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
          E-mail : <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a>
        </address>
      </Article>
    </div>
  );
}
