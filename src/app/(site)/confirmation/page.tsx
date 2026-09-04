"use client";

import { Suspense } from "react";
import { ConfirmationContent } from "./confirmation-content";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
