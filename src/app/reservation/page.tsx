"use client";

import { Suspense } from "react";
import { ReservationFlow } from "@/components/reservation/reservation-flow";

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>}>
      <ReservationFlow />
    </Suspense>
  );
}
