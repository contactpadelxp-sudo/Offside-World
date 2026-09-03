"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { SPORTFINDER_URL, FOOT_INCLUS } from "@/data/foot";
import { Ampoule, Coche, FlecheGauche, Horloge, LienExterne, Trophee } from "@/components/icons";

export function FootFlow({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Trophee className="size-7 text-field" /> Location de terrain
      </h1>
      <p className="mt-1 text-muted-foreground">Terrain privé entre amis, à l&apos;heure.</p>

      <FadeIn className="mt-6">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="inline-flex items-center justify-center rounded-xl bg-field/10 p-3 text-field">
              <LienExterne className="size-6" />
            </div>
            <h2 className="mt-3 text-lg font-bold">Réservation via SportFinder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nos créneaux de terrain sont gérés sur SportFinder : vous y voyez les
              disponibilités en temps réel et réglez directement en ligne.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {FOOT_INCLUS.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <Coche className="size-4 text-field mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={SPORTFINDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass-field mt-6 inline-flex items-center justify-center gap-2 text-[#0a0a0b] h-12 px-6 rounded-2xl font-semibold w-full sm:w-auto"
            >
              Voir les créneaux sur SportFinder <LienExterne className="size-4" />
            </a>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-field/5 border border-field/20 p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Ampoule className="size-5 text-field shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Tout est fourni :</strong> vous n&apos;avez qu&apos;à venir jouer.</p>
          </div>
          <div className="rounded-xl bg-field/5 border border-field/20 p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Horloge className="size-5 text-field shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Dernière minute acceptée</strong> selon les disponibilités.</p>
          </div>
        </div>

        <div className="mt-8">
          <Button variant="ghost" onClick={onBack} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
        </div>
      </FadeIn>
    </div>
  );
}
