"use client";

import { Card } from "@/components/ui/card";
import { StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Photo } from "@/components/photo";
import { usePhoto } from "@/components/photos-provider";
import { FlecheDroite, Gateau, Groupe, IconType, Trophee, Visuel } from "@/components/icons";
import type { Activity } from "../reservation-flow";

type ActivityCard = {
  id: Activity;
  icon: IconType;
  title: string;
  description: string;
  /** Emplacement photo : `null` tant que l'image n'est pas fournie → placeholder. */
  img: string | null;
  /** Cadrage dans le cadre 4/5 (utile pour les images portrait ou paysage). */
  imgPosition?: string;
  tag: string;
  accentText: string;
  accentBadge: string;
  iconBg: string;
  border: string;
  /** Halo de couleur derrière l'emplacement photo. */
  glow: string;
};


export function ActivityChoice({ onSelect }: { onSelect: (a: Activity) => void }) {
  const photoBubble = usePhoto("bubble-portrait");
  const photoBallon = usePhoto("ballon-terrain");

  const activities: ActivityCard[] = [
    {
      id: "anniversaire" as Activity,
      icon: Gateau,
      title: "Anniversaire",
      description: "Deux formules 100 % foot — Kick-Off et Bubble — jusqu'à 10 enfants.",
      img: null,
      tag: "Dès 180 €",
      accentText: "text-kick",
      accentBadge: "bg-kick/15 text-kick",
      iconBg: "bg-kick/15 text-kick",
      border: "border-kick/20 hover:border-kick/60",
      glow: "bg-kick/25",
    },
    {
      id: "foot" as Activity,
      icon: Trophee,
      title: "Louer un terrain",
      description: "Réservez un terrain privé entre amis, à l'heure.",
      img: photoBallon,
      tag: "Réservation en ligne",
      accentText: "text-field",
      accentBadge: "bg-field/15 text-field",
      iconBg: "bg-field/15 text-field",
      border: "border-field/20 hover:border-field/60",
      glow: "bg-field/25",
    },
    {
      id: "groupes" as Activity,
      icon: Groupe,
      title: "Bubble Foot & Team Building",
      description: "Bubble Foot à 23 €/personne, ou privatisation à la demi-journée.",
      img: photoBubble,
      // Les bulles sont à ~54 % de la hauteur de la photo.
      imgPosition: "object-[center_54%]",
      tag: "Dès 23 €/pers.",
      accentText: "text-kick",
      accentBadge: "bg-kick/15 text-kick",
      iconBg: "bg-kick/15 text-kick",
      border: "border-field/20 hover:border-field/60",
      glow: "bg-kick/20",
    },
  ];

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
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {act.img ? (
                      <Photo
                        src={act.img}
                        alt={act.title}
                        sizes="(max-width: 640px) 100vw, 380px"
                        className={`object-cover ${act.imgPosition ?? "object-center"} transition-transform duration-700 group-hover:scale-105`}
                      />
                    ) : (
                      /* Placeholder tant que la photo n'est pas fournie */
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/[0.035] to-transparent" />
                        <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                        <div aria-hidden className={`absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 size-44 rounded-full blur-3xl ${act.glow}`} />
                        <act.icon className="relative size-12 text-foreground/25" />
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
                        <act.icon className="size-5" />
                      </div>
                      <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] leading-tight">{act.title}</h3>
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
