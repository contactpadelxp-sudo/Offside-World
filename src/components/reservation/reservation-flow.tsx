"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { RESERVER_RESET_EVENT } from "@/lib/events";
import { ActivityChoice } from "./steps/activity-choice";
import { AnniversaireFlow } from "./steps/anniversaire-flow";
import { FootFlow } from "./steps/foot-flow";
import { GroupesFlow } from "./steps/groupes-flow";

export type Activity = "anniversaire" | "foot" | "groupes" | null;

const ACTIVITIES = ["anniversaire", "foot", "groupes"] as const;

export function ReservationFlow() {
  const searchParams = useSearchParams();
  const [activity, setActivity] = useState<Activity>(null);

  // Changer d'activité ramène en haut de page.
  useScrollTop(activity);

  /**
   * Synchronisation depuis l'URL : gère les liens directs
   * (/reservation?activite=…) ainsi que les boutons « précédent » et
   * « suivant » du navigateur.
   */
  useEffect(() => {
    const a = searchParams.get("activite");
    setActivity(a && (ACTIVITIES as readonly string[]).includes(a) ? (a as Activity) : null);
  }, [searchParams]);

  /**
   * `router.push` ne met pas l'URL à jour quand on RETIRE le paramètre d'une
   * route prérendue statiquement (l'ajouter fonctionne, pas l'inverse). La doc
   * Next recommande l'API History native pour un changement de paramètres sur
   * une même route : elle se synchronise avec `useSearchParams`, et le bouton
   * « retour » du navigateur continue de fonctionner.
   */
  const selectActivity = useCallback((a: Activity) => {
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
    const reset = () => {
      setActivity(null);
      window.history.replaceState(null, "", "/reservation");
    };
    window.addEventListener(RESERVER_RESET_EVENT, reset);
    return () => window.removeEventListener(RESERVER_RESET_EVENT, reset);
  }, [selectActivity]);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-8 md:pt-32 md:pb-12">
      {!activity && <ActivityChoice onSelect={selectActivity} />}
      {activity === "anniversaire" && <AnniversaireFlow onBack={backToChoice} />}
      {activity === "foot" && <FootFlow onBack={backToChoice} />}
      {activity === "groupes" && <GroupesFlow onBack={backToChoice} />}
    </div>
  );
}
