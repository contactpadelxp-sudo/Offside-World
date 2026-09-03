"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { ActivityChoice } from "./steps/activity-choice";
import { AnniversaireFlow } from "./steps/anniversaire-flow";
import { FootFlow } from "./steps/foot-flow";
import { GroupesFlow } from "./steps/groupes-flow";

export type Activity = "anniversaire" | "foot" | "groupes" | null;

const ACTIVITIES = ["anniversaire", "foot", "groupes"] as const;

const stepLabels: Record<string, string> = {
  anniversaire: "Anniversaire",
  foot: "Location de terrain",
  groupes: "Bubble Foot & Team Building",
};

export function ReservationFlow() {
  const searchParams = useSearchParams();
  const [activity, setActivity] = useState<Activity>(null);

  // Changer d'activité doit ramener en haut de page.
  useScrollTop(activity);

  useEffect(() => {
    const a = searchParams.get("activite");
    if (a && (ACTIVITIES as readonly string[]).includes(a)) {
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

      {!activity && <ActivityChoice onSelect={setActivity} />}
      {activity === "anniversaire" && <AnniversaireFlow onBack={() => setActivity(null)} />}
      {activity === "foot" && <FootFlow onBack={() => setActivity(null)} />}
      {activity === "groupes" && <GroupesFlow onBack={() => setActivity(null)} />}
    </div>
  );
}
