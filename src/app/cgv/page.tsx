import type { Metadata } from "next";
import {
  NOM_COMMERCIAL, DENOMINATION_SOCIALE, SIEGE_SOCIAL, BCE, TVA,
  ADRESSE, ADRESSE_LIGNE, EMAIL, TELEPHONE, TELEPHONE_TEL,
  MAJ_LEGALE, ouACompleter,
} from "@/data/entreprise";

export const metadata: Metadata = {
  title: `Conditions Générales de Vente | ${NOM_COMMERCIAL}`,
  description: `Conditions Générales de Vente de ${NOM_COMMERCIAL}.`,
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

const Liste = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);

export default function CGV() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Version du {MAJ_LEGALE}</p>
      <h1 className="text-3xl font-bold">Conditions Générales de Vente</h1>
      <p className="mt-2 text-muted-foreground">{NOM_COMMERCIAL}</p>

      <Article n={1} titre="Identité de l'entreprise">
        <P>Les présentes Conditions Générales de Vente sont proposées par :</P>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>
            <strong>{ouACompleter(DENOMINATION_SOCIALE, "dénomination sociale à compléter")}</strong>,
            {" "}exploitant sous le nom commercial <strong>{NOM_COMMERCIAL}</strong>
          </li>
          <li><strong>Adresse d&apos;exploitation :</strong> {ADRESSE_LIGNE}</li>
          <li><strong>Siège social :</strong> {ouACompleter(SIEGE_SOCIAL, "à compléter si différent")}</li>
          <li><strong>N° d&apos;entreprise (BCE) :</strong> {ouACompleter(BCE)}</li>
          <li><strong>N° de TVA :</strong> BE {ouACompleter(TVA)}</li>
          <li><strong>E-mail :</strong> <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a></li>
          <li><strong>Téléphone :</strong> <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a></li>
        </ul>
        <P>Ci-après dénommé « Offside ».</P>
      </Article>

      <Article n={2} titre="Champ d'application">
        <P>
          Les présentes Conditions Générales de Vente s&apos;appliquent à l&apos;ensemble des
          réservations et prestations proposées par Offside, notamment :
        </P>
        <Liste items={[
          "location de terrains de football indoor ;",
          "formules anniversaires ;",
          "Bubble Foot ;",
          "animations ;",
          "stages et entraînements organisés directement par Offside ;",
          "événements et autres activités proposées dans le centre.",
        ]} />
        <P>
          Toute réservation implique que le client a pu prendre connaissance des présentes
          conditions avant la conclusion du contrat et les accepte.
        </P>
        <P>
          Les éventuelles conditions particulières indiquées lors de la réservation complètent
          les présentes Conditions Générales de Vente.
        </P>
      </Article>

      <Article n={3} titre="Réservation">
        <P>
          Une réservation est considérée comme définitive après confirmation par Offside et,
          lorsque cela est demandé, après réception du paiement ou de l&apos;acompte prévu.
        </P>
        <P>
          Le client est responsable de l&apos;exactitude des informations communiquées lors de sa
          réservation, notamment la date, l&apos;heure, le type d&apos;activité, le nombre de
          participants et ses coordonnées.
        </P>
        <P>
          Pour les activités organisées pour des mineurs, la réservation doit être effectuée par
          une personne majeure.
        </P>
        <P>
          Offside se réserve le droit de refuser une réservation en cas d&apos;indisponibilité, de
          problème de sécurité, d&apos;impayé antérieur ou de comportement incompatible avec le bon
          fonctionnement du centre.
        </P>
      </Article>

      <Article n={4} titre="Prix">
        <P>Les prix applicables sont ceux affichés au moment de la réservation.</P>
        <P>
          Les prix destinés aux consommateurs sont indiqués toutes taxes comprises, sauf mention
          contraire clairement indiquée.
        </P>
        <P>
          Toute prestation ou option supplémentaire demandée par le client peut faire l&apos;objet
          d&apos;un supplément communiqué avant son acceptation.
        </P>
        <P>
          Les tarifs peuvent être modifiés à tout moment pour les nouvelles réservations. Une
          modification tarifaire n&apos;affecte pas une réservation déjà confirmée.
        </P>
      </Article>

      <Article n={5} titre="Paiement">
        <P>Les modalités de paiement disponibles sont indiquées au moment de la réservation.</P>
        <P>
          Lorsque le paiement intégral ou un acompte est demandé pour confirmer une réservation,
          celle-ci ne devient définitive qu&apos;après réception du montant demandé.
        </P>
        <P>
          En cas de non-paiement dans le délai indiqué, Offside peut libérer le créneau réservé
          après en avoir informé le client.
        </P>
      </Article>

      <Article n={6} titre="Annulation ou modification par le client">
        <P>
          Le présent article s&apos;applique uniquement aux réservations de formules anniversaires
          organisées par Offside.
        </P>
        <P>
          Les réservations de terrains de football effectuées via la plateforme SportFinder sont
          soumises aux conditions générales et aux conditions d&apos;annulation applicables sur
          cette plateforme. Pour toute question ou demande concernant une réservation de terrain
          effectuée via SportFinder, le client doit se référer aux conditions de SportFinder et
          contacter la plateforme selon les modalités prévues.
        </P>
        <P>
          Une réservation d&apos;anniversaire concerne un créneau déterminé spécialement bloqué
          pour le client.
        </P>
        <P>
          Toute demande d&apos;annulation ou de modification d&apos;une formule anniversaire doit
          être adressée à Offside dans les meilleurs délais par e-mail ou par téléphone.
        </P>
        <P>
          Sauf conditions particulières communiquées au moment de la réservation, les règles
          suivantes s&apos;appliquent :
        </P>
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold">Plus de 7 jours calendrier avant l&apos;anniversaire</p>
            <p className="text-muted-foreground text-sm mt-1">
              Le client peut demander le remboursement des sommes versées ou le report de la
              réservation vers une autre date disponible.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold">Entre 7 jours et 48 heures avant l&apos;anniversaire</p>
            <p className="text-muted-foreground text-sm mt-1">
              50 % du prix de la réservation reste dû. Si le montant a déjà été payé intégralement,
              50 % est remboursé.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold">Moins de 48 heures avant l&apos;anniversaire ou non-présentation</p>
            <p className="text-muted-foreground text-sm mt-1">
              Le prix de la réservation reste intégralement dû et aucun remboursement n&apos;est prévu.
            </p>
          </div>
        </div>
        <P>
          Lorsque cela est possible, Offside peut, à titre commercial, proposer un changement de
          date. Cette possibilité dépend toutefois des disponibilités du centre et ne constitue pas
          un droit automatique.
        </P>
      </Article>

      <section className="mt-8 space-y-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
        <h2 className="text-xl font-bold">7. Absence de droit de rétractation pour les activités à date déterminée</h2>
        <P>
          Les prestations proposées par Offside constituent notamment des services liés à des
          activités de loisirs prévus pour une date ou une période d&apos;exécution spécifique.
        </P>
        <P>
          Conformément à l&apos;article VI.53, 12° du Code de droit économique belge, le
          consommateur ne bénéficie donc <strong>pas du droit légal de rétractation de 14 jours</strong>{" "}
          pour une réservation portant sur une date ou un créneau déterminé.
        </P>
        <P>
          Les possibilités d&apos;annulation éventuellement accordées par Offside sont celles
          prévues à l&apos;article 6 des présentes conditions ou dans les conditions particulières
          communiquées au moment de la réservation.
        </P>
      </section>

      <Article n={8} titre="Horaires et retard">
        <P>
          Le client est invité à se présenter suffisamment à l&apos;avance pour pouvoir commencer
          son activité à l&apos;heure prévue.
        </P>
        <P>
          Un retard du client ne prolonge pas automatiquement la durée de la réservation lorsque le
          créneau suivant est occupé.
        </P>
        <P>
          Offside fera toutefois son possible pour limiter l&apos;impact d&apos;un léger retard
          lorsque l&apos;organisation du centre le permet.
        </P>
      </Article>

      <Article n={9} titre="Règles de comportement et de sécurité">
        <P>Les participants doivent :</P>
        <Liste items={[
          "respecter les consignes communiquées par le personnel d'Offside ;",
          "utiliser les installations et le matériel conformément à leur destination ;",
          "adopter un comportement respectueux envers les autres participants, le personnel et les installations ;",
          "ne pas adopter de comportement dangereux, violent ou manifestement incompatible avec l'activité ;",
          "porter une tenue et des chaussures adaptées à la pratique sportive.",
        ]} />
        <P>
          Offside peut interrompre la participation d&apos;une personne dont le comportement met en
          danger sa propre sécurité, celle d&apos;autres personnes ou les installations.
        </P>
        <P>
          Une telle exclusion motivée par un comportement dangereux ou gravement inapproprié ne
          donne pas automatiquement droit à un remboursement.
        </P>
      </Article>

      <Article n={10} titre="Participation et aptitude à l'activité">
        <P>Les activités proposées par Offside impliquent une activité physique.</P>
        <P>
          Chaque participant doit apprécier sa capacité à participer à l&apos;activité et respecter
          ses propres limites.
        </P>
        <P>
          Toute information pertinente susceptible d&apos;avoir une incidence sur la sécurité de la
          participation doit être communiquée à Offside ou à l&apos;animateur avant le début de
          l&apos;activité.
        </P>
        <P>
          En cas de doute concernant la capacité d&apos;une personne à participer à une activité, il
          appartient au participant ou à son représentant légal de demander un avis médical approprié.
        </P>
      </Article>

      <Article n={11} titre="Mineurs">
        <P>
          Lorsqu&apos;une activité concerne des enfants ou des adolescents, l&apos;adulte ayant
          effectué la réservation est le principal interlocuteur d&apos;Offside.
        </P>
        <P>
          Sauf lorsqu&apos;un encadrement spécifique est expressément compris dans la formule
          réservée, la réservation d&apos;un terrain ou d&apos;un espace ne constitue pas un service
          de garde d&apos;enfants.
        </P>
        <P>
          Les parents ou responsables doivent respecter les indications communiquées par Offside
          concernant la présence ou la supervision nécessaire des mineurs.
        </P>
      </Article>

      <Article n={12} titre="Anniversaires">
        <P>
          Le contenu exact de chaque formule anniversaire est celui indiqué sur le site ou dans la
          confirmation de réservation.
        </P>
        <P>
          Sauf indication contraire, le gâteau d&apos;anniversaire n&apos;est pas fourni par Offside
          et peut être apporté par le client.
        </P>
        <P>
          Le client reste responsable des aliments qu&apos;il apporte, notamment concernant leur
          conservation, leur composition et la prise en compte des éventuelles allergies ou
          intolérances des participants.
        </P>
        <P>
          Le nombre de participants compris dans la formule ainsi que le prix des enfants
          supplémentaires sont indiqués dans l&apos;offre choisie.
        </P>
      </Article>

      <Article n={13} titre="Bubble Foot">
        <P>
          Le Bubble Foot est une activité physique particulière nécessitant le respect strict des
          consignes de l&apos;animateur.
        </P>
        <P>
          Les participants doivent utiliser les bulles et le matériel exclusivement de la manière
          expliquée par l&apos;animateur.
        </P>
        <P>
          L&apos;animateur Bubble est compris dans les prestations pour lesquelles sa présence est
          annoncée comme obligatoire.
        </P>
        <P>
          Offside ou l&apos;animateur peut empêcher ou interrompre la participation d&apos;une
          personne lorsqu&apos;il estime raisonnablement que les conditions de sécurité ne sont pas
          respectées.
        </P>
      </Article>

      <Article n={14} titre="Matériel et installations">
        <P>Le matériel mis à disposition reste la propriété d&apos;Offside.</P>
        <P>
          Toute dégradation volontaire ou résultant d&apos;une utilisation manifestement contraire
          aux instructions peut être facturée au responsable de la réservation, à concurrence du
          dommage effectivement subi et dans le respect de la législation applicable.
        </P>
      </Article>

      <Article n={15} titre="Vidéo et système Replay">
        <P>
          Certains terrains Offside sont équipés de caméras permettant notamment de proposer un
          système de replay ou une vidéo souvenir.
        </P>
        <P>Lorsqu&apos;une telle fonctionnalité fait partie de la prestation, le client en est informé.</P>
        <P>Les images réalisées dans ce cadre ne sont pas automatiquement utilisées à des fins publicitaires.</P>
        <P>
          Toute publication identifiable d&apos;un participant à des fins commerciales ou
          promotionnelles fait l&apos;objet d&apos;une base juridique appropriée et, lorsque le
          consentement est requis, d&apos;une autorisation distincte.
        </P>
        <P>
          Pour les mineurs, une attention particulière est portée à l&apos;autorisation du
          représentant légal lorsque celle-ci est nécessaire.
        </P>
        <P>
          Les modalités relatives au traitement de ces images sont détaillées dans la{" "}
          <a href="/confidentialite" className="underline text-primary">Politique de confidentialité</a> d&apos;Offside.
        </P>
      </Article>

      <Article n={16} titre="Responsabilité">
        <P>
          Offside met à disposition des installations et du matériel entretenus et veille au bon
          déroulement de ses activités conformément aux obligations qui lui incombent.
        </P>
        <P>
          La pratique du football et du Bubble Foot comporte néanmoins les risques ordinaires
          inhérents à une activité sportive.
        </P>
        <P>Offside n&apos;est pas responsable d&apos;un dommage résultant exclusivement :</P>
        <Liste items={[
          "du non-respect des consignes de sécurité par un participant ;",
          "d'un comportement volontairement dangereux ;",
          "d'une utilisation manifestement incorrecte des installations ou du matériel ;",
          "d'un fait imputable à un tiers ou à une circonstance extérieure qu'Offside ne pouvait raisonnablement éviter.",
        ]} />
        <P>
          Aucune disposition des présentes conditions ne vise à exclure ou limiter une
          responsabilité qui ne pourrait légalement être exclue ou limitée.
        </P>
      </Article>

      <Article n={17} titre="Effets personnels">
        <P>Les participants sont invités à surveiller leurs effets personnels.</P>
        <P>Les objets trouvés peuvent être conservés temporairement par Offside.</P>
        <P>
          La responsabilité d&apos;Offside en cas de perte, de vol ou de détérioration est appréciée
          conformément au droit applicable et aux circonstances concrètes de l&apos;événement.
        </P>
      </Article>

      <Article n={18} titre="Annulation par Offside">
        <P>
          Offside peut exceptionnellement devoir déplacer ou annuler une activité pour des raisons
          techniques, de sécurité, de force majeure ou en raison d&apos;une circonstance rendant
          raisonnablement impossible la fourniture de la prestation.
        </P>
        <P>Dans ce cas, Offside proposera au client :</P>
        <Liste items={[
          "soit une nouvelle date ;",
          "soit le remboursement des montants payés pour la prestation qui n'a pas pu être fournie.",
        ]} />
      </Article>

      <Article n={19} titre="Données personnelles">
        <P>
          Les données personnelles communiquées dans le cadre d&apos;une réservation sont traitées
          conformément au Règlement général sur la protection des données et à la{" "}
          <a href="/confidentialite" className="underline text-primary">Politique de confidentialité</a>{" "}
          d&apos;Offside disponible sur le site.
        </P>
      </Article>

      <Article n={20} titre="Réclamations">
        <P>Toute réclamation peut être adressée à :</P>
        <address className="not-italic text-muted-foreground">
          {NOM_COMMERCIAL}<br />
          {ADRESSE.rue}<br />
          {ADRESSE.codePostal} {ADRESSE.ville}<br />
          {ADRESSE.pays}<br />
          E-mail : <a href={`mailto:${EMAIL}`} className="underline text-primary">{EMAIL}</a><br />
          Téléphone : <a href={`tel:${TELEPHONE_TEL}`} className="underline text-primary">{TELEPHONE}</a>
        </address>
        <P>Offside privilégie toujours la recherche d&apos;une solution amiable.</P>
        <P>
          Lorsqu&apos;un litige de consommation ne peut pas être réglé directement entre les
          parties, le consommateur peut également s&apos;informer sur les possibilités de règlement
          extrajudiciaire des litiges disponibles en Belgique.
        </P>
      </Article>

      <Article n={21} titre="Droit applicable">
        <P>Les présentes Conditions Générales de Vente sont régies par le droit belge.</P>
        <P>
          En cas de litige avec un consommateur, les règles légales impératives relatives à la
          compétence des tribunaux restent pleinement applicables.
        </P>
      </Article>

      <Article n={22} titre="Nullité partielle">
        <P>
          Si une disposition des présentes Conditions Générales de Vente devait être déclarée nulle
          ou inapplicable, cette situation n&apos;affectera pas les autres dispositions, dans la
          mesure où celles-ci peuvent continuer à produire leurs effets légalement.
        </P>
      </Article>
    </div>
  );
}
