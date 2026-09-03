"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Photo } from "@/components/photo";
import { usePhoto } from "@/components/photos-provider";
import { SPORTFINDER_URL, FOOT_INCLUS } from "@/data/foot";
import { Ampoule, Coche, FlecheGauche, Horloge, LienExterne, Trophee, Visuel } from "@/components/icons";

export function FootFlow({ onBack }: { onBack: () => void }) {
  const photo = usePhoto("joueur-ballon");

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Trophee className="size-7 text-field" /> Louer un terrain
      </h1>
      <p className="mt-1 text-muted-foreground">Terrain privé entre amis, à l&apos;heure.</p>

      <FadeIn className="mt-8">
        {/* Photo à gauche, contenu à droite : les deux tiennent dans l'écran */}
        <Card className="overflow-hidden border-2 py-0 gap-0 border-field/20">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[240px] md:min-h-full overflow-hidden">
              {photo ? (
                <Photo
                  src={photo}
                  alt="Joueur avec un ballon sur les terrains d'Offside Foot Indoor"
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover object-[center_20%]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                  <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-44 rounded-full bg-field/25 blur-3xl" />
                  <Trophee className="relative size-12 text-foreground/25" />
                  <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                    <Visuel className="size-3.5" /> Photo à venir
                  </span>
                </div>
              )}
              {/* Fondu vers le contenu : vertical en pile, horizontal sur deux colonnes */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-card md:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-card hidden md:block" />
            </div>

            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">
                Réservez votre créneau en ligne
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Le planning des terrains est tenu à jour en temps réel. Vous choisissez
                votre créneau et réglez directement en ligne.
              </p>

              <ul className="mt-5 space-y-2">
                {FOOT_INCLUS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Coche className="size-4 text-field mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href={SPORTFINDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass-field mt-6 inline-flex items-center justify-center gap-2 text-[#0a0a0b] h-12 px-6 rounded-2xl font-semibold w-full md:w-auto md:self-start"
              >
                Voir les créneaux <LienExterne className="size-4" />
              </a>
            </div>
          </div>
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
