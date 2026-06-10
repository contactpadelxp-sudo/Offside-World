"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityChoice } from "./steps/activity-choice";
import { AnniversaireFlow } from "./steps/anniversaire-flow";
import { LibreFlow } from "./steps/libre-flow";
import { FootFlow } from "./steps/foot-flow";
import { TeamBuildingFlow } from "./steps/team-building-flow";

export type Activity = "anniversaire" | "libre" | "foot" | "team-building" | null;

const stepLabels: Record<string, string> = {
  anniversaire: "Anniversaire",
  libre: "Entrée libre",
  foot: "Foot",
  "team-building": "Team Building",
};

export function ReservationFlow() {
  const searchParams = useSearchParams();
  const formuleParam = searchParams.get("formule") ?? undefined;

  const a = searchParams.get("activite");
  const paramActivity: Activity =
    a && ["anniversaire", "libre", "foot", "team-building"].includes(a) ? (a as Activity) : null;

  const [activity, setActivity] = useState<Activity>(paramActivity);
  // Resynchronise l'activité quand l'URL change (pattern React "adjust state on prop change")
  const [lastParamActivity, setLastParamActivity] = useState<Activity>(paramActivity);
  if (paramActivity !== lastParamActivity) {
    setLastParamActivity(paramActivity);
    if (paramActivity) setActivity(paramActivity);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-8 md:pt-28 md:pb-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setActivity(null)} className="hover:text-foreground">
          Réservation
        </button>
        {activity && (
          <>
            <span>/</span>
            <span className="text-foreground font-medium">{stepLabels[activity]}</span>
          </>
        )}
      </nav>

      {!activity && (
        <ActivityChoice onSelect={setActivity} />
      )}
      {activity === "anniversaire" && (
        <AnniversaireFlow onBack={() => setActivity(null)} initialFormuleId={formuleParam} />
      )}
      {activity === "libre" && (
        <LibreFlow onBack={() => setActivity(null)} />
      )}
      {activity === "foot" && (
        <FootFlow onBack={() => setActivity(null)} />
      )}
      {activity === "team-building" && (
        <TeamBuildingFlow onBack={() => setActivity(null)} />
      )}
    </div>
  );
}
