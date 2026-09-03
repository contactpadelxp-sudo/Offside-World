"use client";

import { Card } from "@/components/ui/card";
import { StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Photo } from "@/components/photo";
import { Cake, Trophy, Users, ArrowRight, Star } from "lucide-react";
import type { Activity } from "../reservation-flow";

type ActivityCard = {
  id: Activity;
  icon: typeof Cake;
  title: string;
  description: string;
  img: string;
  tag: string;
  featured?: boolean;
  accentText: string;
  accentBadge: string;
  iconBg: string;
  border: string;
};

const activities: ActivityCard[] = [
  {
    id: "anniversaire" as Activity,
    icon: Cake,
    title: "Anniversaire",
    description:
      "Deux formules 100 % foot — Kick-Off et Bubble — pour un anniversaire inoubliable, jusqu'à 10 enfants.",
    img: "/images/anniv.jpg",
    tag: "Dès 180 €",
    featured: true,
    accentText: "text-kick",
    accentBadge: "bg-kick/15 text-kick",
    iconBg: "bg-kick/15 text-kick",
    border: "border-kick/20 hover:border-kick/60",
  },
  {
    id: "foot" as Activity,
    icon: Trophy,
    title: "Location de terrain",
    description: "Réservez un terrain privé entre amis, via SportFinder.",
    img: "/images/foot3.jpeg",
    tag: "Via SportFinder",
    accentText: "text-field",
    accentBadge: "bg-field/15 text-field",
    iconBg: "bg-field/15 text-field",
    border: "border-field/20 hover:border-field/60",
  },
  {
    id: "groupes" as Activity,
    icon: Users,
    title: "Bubble Foot & Team Building",
    description: "Bubble Foot à 23 €/personne, ou privatisation à la demi-journée.",
    img: "/images/foot2.avif",
    tag: "Dès 23 €/pers.",
    accentText: "text-kick",
    accentBadge: "bg-kick/15 text-kick",
    iconBg: "bg-kick/15 text-kick",
    border: "border-field/20 hover:border-field/60",
  },
];

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${className}`}>
      {children}
    </span>
  );
}

export function ActivityChoice({ onSelect }: { onSelect: (a: Activity) => void }) {
  const featured = activities.find((a) => a.featured)!;
  const others = activities.filter((a) => !a.featured);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold">Réserver</h1>
      <p className="mt-2 text-muted-foreground">Choisissez votre activité pour commencer.</p>

      <StaggerContainer className="mt-8 space-y-4" staggerDelay={0.1}>
        {/* ── Carte mise en avant : Anniversaire ── */}
        <StaggerItem>
          <Tilt3D intensity={5}>
            <button onClick={() => onSelect(featured.id)} className="w-full text-left group">
              <Card className={`overflow-hidden border-2 transition-all duration-500 cursor-pointer ${featured.border} bg-card`}>
                <div className="grid md:grid-cols-2">
                  {/* Cadre photo */}
                  <div className="relative min-h-[220px] md:min-h-[300px] overflow-hidden">
                    <Photo
                      src={featured.img}
                      alt="Anniversaire foot indoor à Offside Foot Indoor"
                      sizes="(max-width: 768px) 100vw, 520px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-card/90" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <Tag className="bg-kick text-[#0a0a0b]">
                        <Star className="size-3 mr-1 fill-current" /> Le plus populaire
                      </Tag>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center justify-center rounded-xl p-3 ${featured.iconBg} group-hover:scale-110 transition-transform duration-500`}>
                        <featured.icon className="size-6" />
                      </div>
                      <Tag className={featured.accentBadge}>{featured.tag}</Tag>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold font-[family-name:var(--font-heading)]">{featured.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{featured.description}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 font-semibold ${featured.accentText} group-hover:gap-3 transition-all duration-300`}>
                      Choisir cette activité <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </button>
          </Tilt3D>
        </StaggerItem>

        {/* ── Deux cartes secondaires ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((act) => (
            <StaggerItem key={act.id}>
              <Tilt3D intensity={8}>
                <button onClick={() => onSelect(act.id)} className="w-full text-left h-full group">
                  <Card className={`h-full overflow-hidden border-2 transition-all duration-500 cursor-pointer ${act.border} bg-card flex flex-col`}>
                    {/* Cadre photo */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Photo
                        src={act.img}
                        alt={act.title}
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute left-3 top-3">
                        <Tag className={`${act.accentBadge} !bg-black/40`}>{act.tag}</Tag>
                      </div>
                      <div className={`absolute right-3 bottom-3 inline-flex items-center justify-center rounded-xl p-2.5 ${act.iconBg} backdrop-blur-md group-hover:scale-110 transition-transform duration-500`}>
                        <act.icon className="size-5" />
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold font-[family-name:var(--font-heading)]">{act.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground flex-1">{act.description}</p>
                      <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${act.accentText} group-hover:gap-2.5 transition-all duration-300`}>
                        Choisir <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Card>
                </button>
              </Tilt3D>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    </div>
  );
}
