"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Cake, CircleDot, Trophy, Building2, ArrowRight } from "lucide-react";
import type { Activity } from "../reservation-flow";

const activities = [
  {
    id: "anniversaire" as Activity,
    icon: Cake,
    title: "Anniversaire",
    description: "Fêtez un anniversaire inoubliable avec foot, Bubble Foot et goûter !",
    gradient: "from-kick/10 via-white to-orange-50",
    border: "border-kick/20 hover:border-kick/50",
    iconBg: "bg-kick/10 text-kick",
    accentColor: "text-kick",
    span: "md:col-span-2",
  },
  {
    id: "libre" as Activity,
    icon: CircleDot,
    title: "Entrée libre",
    description: "Rejoignez une session ouverte à tous.",
    gradient: "from-field/10 via-white to-field/5",
    border: "border-field/20 hover:border-field/50",
    iconBg: "bg-field/10 text-field",
    accentColor: "text-field",
    span: "",
  },
  {
    id: "foot" as Activity,
    icon: Trophy,
    title: "Location de terrain",
    description: "Réservez un terrain privé entre amis.",
    gradient: "from-field/10 via-white to-field/5",
    border: "border-field/20 hover:border-field/50",
    iconBg: "bg-field/10 text-field",
    accentColor: "text-field",
    span: "",
  },
  {
    id: "team-building" as Activity,
    icon: Building2,
    title: "Team Building",
    description: "Événement sportif pour votre entreprise.",
    gradient: "from-field/10 via-white to-field/5",
    border: "border-field/20 hover:border-field/50",
    iconBg: "bg-field/10 text-field",
    accentColor: "text-field",
    span: "",
  },
];

export function ActivityChoice({ onSelect }: { onSelect: (a: Activity) => void }) {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold">Réserver</h1>
      <p className="mt-2 text-muted-foreground">Choisissez votre activité pour commencer.</p>
      <StaggerContainer className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.1}>
        {activities.map((act) => (
          <StaggerItem key={act.id} className={act.span}>
            <Tilt3D intensity={10}>
              <button onClick={() => onSelect(act.id)} className="w-full text-left h-full">
                <Card className={`h-full border-2 transition-all duration-500 cursor-pointer bg-gradient-to-br ${act.gradient} ${act.border} group`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center rounded-xl p-3 ${act.iconBg} group-hover:scale-110 transition-transform duration-500`}>
                      <act.icon className="size-6" />
                    </div>
                    <h3 className="mt-3 text-lg font-bold font-[family-name:var(--font-heading)]">{act.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{act.description}</p>
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${act.accentColor} group-hover:gap-2.5 transition-all duration-300`}>
                      Choisir <ArrowRight className="size-4" />
                    </span>
                  </CardContent>
                </Card>
              </button>
            </Tilt3D>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
