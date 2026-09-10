"use client";

import { Card } from "@/components/ui/card";
import { StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Photo } from "@/components/photo";
import { FlecheDroite, Visuel } from "@/components/icons";
import { useActivites } from "@/components/activites/use-activites";
import type { Activity } from "../reservation-flow";
import type { FormuleVue } from "@/lib/vues";

/**
 * Choix de l'activité — première étape du tunnel.
 *
 * LES TROIS ACTIVITÉS NE SONT PLUS DÉCRITES ICI. Elles viennent de
 * `useActivites()`, partagé avec le hero de la page d'accueil, parce que les
 * décrire à deux endroits les avait déjà fait diverger. Ce fichier ne garde que
 * la MISE EN FORME de la page Réserver, qui lui est propre et qui ne doit pas
 * bouger : le rendu de cette page est gelé, à la classe près.
 */

export function ActivityChoice({
  onSelect,
  formules,
}: {
  onSelect: (a: Activity) => void;
  formules: FormuleVue[];
}) {
  const activities = useActivites(formules);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold">Réserver</h1>
      <p className="mt-2 text-muted-foreground">Choisissez votre activité pour commencer.</p>

      <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-3" staggerDelay={0.1}>
        {activities.map((act) => (
          <StaggerItem key={act.id} className="h-full">
            <Tilt3D intensity={8} className="h-full">
              <button onClick={() => onSelect(act.id)} className="w-full text-left h-full group">
                <Card className={`h-full overflow-hidden border-2 py-0 gap-0 transition-all duration-500 cursor-pointer ${act.border} bg-card flex flex-col`}>
                  {/* Emplacement photo — fondu dans le corps de la carte */}
                  {/*
                    Format paysage sur téléphone : en 4/5, une seule carte
                    remplissait 83 % de l'écran et on ne pouvait jamais comparer
                    deux offres d'un coup d'œil.
                  */}
                  <div className="relative aspect-[3/2] overflow-hidden sm:aspect-[4/5]">
                    {act.img ? (
                      <Photo
                        src={act.img}
                        alt={act.titre}
                        sizes="(max-width: 640px) 100vw, 380px"
                        className={`object-cover ${act.imgPosition ?? "object-center"} transition-transform duration-700 group-hover:scale-105`}
                      />
                    ) : (
                      /* Placeholder tant que la photo n'est pas fournie */
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/[0.035] to-transparent" />
                        <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                        <div aria-hidden className={`absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 size-44 rounded-full blur-3xl ${act.glow}`} />
                        <act.icone className="relative size-12 text-foreground/25" />
                        <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                          <Visuel className="size-3.5" /> Photo à venir
                        </span>
                      </div>
                    )}
                    {/* Dégradé qui fond l'image dans la carte (supprime la cassure) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-card" />
                    <div className={`absolute left-4 top-4 inline-flex items-center rounded-full bg-black/65 px-3 py-1 text-xs font-semibold ring-1 ring-white/15 backdrop-blur-md ${act.accentText}`}>
                      {act.tag}
                    </div>
                  </div>

                  {/* Contenu — remonte légèrement pour chevaucher le fondu */}
                  <div className="-mt-6 p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${act.iconBg} group-hover:scale-110 transition-transform duration-500`}>
                        <act.icone className="size-5" />
                      </div>
                      <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] leading-tight">{act.titre}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground flex-1">{act.description}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${act.accentText} group-hover:gap-2.5 transition-all duration-300`}>
                      Choisir <FlecheDroite className="size-4" />
                    </span>
                  </div>
                </Card>
              </button>
            </Tilt3D>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
