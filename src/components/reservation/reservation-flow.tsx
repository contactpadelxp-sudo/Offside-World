"use client";

import { useState, useEffect } from "react";
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
  const [activity, setActivity] = useState<Activity>(null);

  useEffect(() => {
    const a = searchParams.get("activite");
    if (a && ["anniversaire", "libre", "foot", "team-building"].includes(a)) {
      setActivity(a as Activity);
    }
  }, [searchParams]);

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
        <AnniversaireFlow onBack={() => setActivity(null)} />
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
