"use client";

import { useState, useEffect, useCallback, useRef, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { RESERVER_RESET_EVENT } from "@/lib/events";
import { mesurer } from "@/lib/mesure";
import type { CreneauVue } from "@/lib/db/creneaux";
import type { FormuleVue, OptionVue } from "@/lib/db/referentiel";
import type { DemiJourneeVue } from "@/lib/demi-journees";
import { ActivityChoice } from "./steps/activity-choice";
import { AnniversaireFlow } from "./steps/anniversaire-flow";
import { FootFlow } from "./steps/foot-flow";
import { GroupesFlow } from "./steps/groupes-flow";
import { estActivite, type ActiviteId } from "@/data/activites";

/*
  Le tunnel tenait sa propre liste des activités, en double de celle du reste du
  site. C'était la quatrième copie des mêmes trois identifiants — avec l'en-tête,
  le pied de page et les cartes. Quatre listes qui doivent rester d'accord, et
  aucun moyen de s'apercevoir qu'elles ne le sont plus : un identifiant qui
  n'est plus reconnu ici ouvre simplement le tunnel sur le choix d'activité,
  comme si le lien n'avait pas été cliqué.
*/
export type Activity = ActiviteId | null;

/**
 * Titre de l'écran affiché, celui qui reçoit le focus quand on change d'étape.
 *
 * Le même objet est partagé entre ce composant et l'écran affiché : chaque
 * écran n'accroche la référence qu'à SON titre, et comme un seul écran est
 * monté à la fois, `titreEtape.current` désigne toujours le titre visible.
 */
export type RefTitre = RefObject<HTMLHeadingElement | null>;



/**
 * Tout ce que le funnel affiche vient de la base, lu par le composant serveur
 * qui rend cette page. Aucun tarif ni aucune disponibilité n'est écrit en dur
 * côté navigateur : c'est ce qui garantit qu'un prix affiché est bien celui que
 * le serveur facturera.
 */
export interface DonneesReservation {
  formules: FormuleVue[];
  options: OptionVue[];
  creneauxAnniversaire: CreneauVue[];
  creneauxBubble: CreneauVue[];
  demiJournees: DemiJourneeVue[];
  /** Le client sera-t-il redirigé vers un paiement au bout du tunnel ? */
  paiementActif: boolean;
}

export function ReservationFlow({ donnees }: { donnees: DonneesReservation }) {
  const searchParams = useSearchParams();
  const [activity, setActivity] = useState<Activity>(null);

  /*
    Les étapes du tunnel sont mesurées ici, en réaction à l'état, et non sur
    chaque bouton : les transitions sont dispersées sur une quinzaine
    d'endroits, et une mesure posée bouton par bouton finit toujours par en
    oublier un — silencieusement, ce qui est le pire cas pour un chiffre qu'on
    croit juste.
  */
  useEffect(() => {
    if (activity) mesurer("activite", activity);
  }, [activity]);

  // Changer d'activité ramène en haut de page.
  useScrollTop(activity);

  /*
    LE FOCUS SUIT L'ÉCRAN, IL NE RESTAIT NULLE PART.

    Changer d'activité ou d'étape ne change pas de page : seul le contenu est
    remplacé. `useScrollTop` remontait bien la fenêtre, mais le focus restait
    sur le bouton cliqué — un bouton aussitôt démonté. Au clavier, la
    tabulation suivante repartait donc du tout début du document (logo, menu,
    bandeau cookies) au lieu de continuer dans la nouvelle étape, et un lecteur
    d'écran ne lisait rien du tout : rien n'annonçait que l'écran avait changé.

    Le déplacement n'est demandé que par les actions qui viennent d'un clic
    dans la page. La synchronisation depuis l'URL, elle, ne le demande pas :
    elle s'exécute aussi à l'ouverture de /reservation?activite=…, où voler le
    focus couperait la lecture de l'en-tête à quelqu'un qui arrive sur le site.
  */
  const titreEtape = useRef<HTMLHeadingElement>(null);
  const focusDemande = useRef(false);
  useEffect(() => {
    if (!focusDemande.current) return;
    focusDemande.current = false;
    // `preventScroll` : on vient de remonter en haut, laisser le navigateur
    // redescendre vers le titre annulerait ce retour.
    titreEtape.current?.focus({ preventScroll: true });
  }, [activity]);

  /**
   * Synchronisation depuis l'URL : gère les liens directs
   * (/reservation?activite=…) ainsi que les boutons « précédent » et
   * « suivant » du navigateur.
   */
  useEffect(() => {
    const a = searchParams.get("activite");
    setActivity(estActivite(a) ? a : null);
  }, [searchParams]);

  /**
   * `router.push` ne met pas l'URL à jour quand on RETIRE le paramètre d'une
   * route prérendue statiquement (l'ajouter fonctionne, pas l'inverse). La doc
   * Next recommande l'API History native pour un changement de paramètres sur
   * une même route : elle se synchronise avec `useSearchParams`, et le bouton
   * « retour » du navigateur continue de fonctionner.
   */
  const selectActivity = useCallback((a: Activity) => {
    focusDemande.current = true;
    setActivity(a);
    window.history.pushState(null, "", a ? `/reservation?activite=${a}` : "/reservation");
  }, []);

  const backToChoice = useCallback(() => selectActivity(null), [selectActivity]);

  /**
   * Clic sur « Réserver » alors qu'on est déjà sur /reservation : la barre de
   * navigation annule son lien et émet cet événement. On revient au choix des
   * trois activités en remplaçant l'entrée d'historique courante, pour ne pas
   * empiler une entrée en double.
   */
  useEffect(() => {
    /*
      LE DRAPEAU NE DOIT PAS SURVIVRE À UN CHANGEMENT QUI N'A PAS EU LIEU.

      La barre de navigation émet cet événement dès qu'on clique « Réserver »
      en étant déjà sur /reservation — y compris quand on est DÉJÀ sur l'écran
      de choix. `setActivity(null)` ne change alors rien, React ne relance pas
      l'effet, et le drapeau restait armé indéfiniment. Le prochain changement
      d'activité le consommait, fût-il venu de l'URL — bouton « précédent » du
      navigateur, ou lien direct suivi sans rechargement —, alors que le
      commentaire ci-dessus promet précisément l'inverse.

      On ne l'arme donc que si l'on quitte réellement un écran.
    */
    const reset = () => {
      setActivity((precedente) => {
        if (precedente !== null) focusDemande.current = true;
        return null;
      });
      window.history.replaceState(null, "", "/reservation");
    };
    window.addEventListener(RESERVER_RESET_EVENT, reset);
    return () => window.removeEventListener(RESERVER_RESET_EVENT, reset);
  }, [selectActivity]);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-8 md:pb-12">
      {!activity && <ActivityChoice onSelect={selectActivity} formules={donnees.formules} titreRef={titreEtape} />}
      {activity === "anniversaire" && (
        <AnniversaireFlow
          paiementActif={donnees.paiementActif}
          onBack={backToChoice}
          titreRef={titreEtape}
          formules={donnees.formules}
          options={donnees.options}
          creneaux={donnees.creneauxAnniversaire}
        />
      )}
      {activity === "foot" && <FootFlow onBack={backToChoice} titreRef={titreEtape} />}
      {activity === "groupes" && (
        <GroupesFlow
          paiementActif={donnees.paiementActif}
          onBack={backToChoice}
          titreRef={titreEtape}
          creneaux={donnees.creneauxBubble}
          demiJournees={donnees.demiJournees}
        />
      )}
    </div>
  );
}
