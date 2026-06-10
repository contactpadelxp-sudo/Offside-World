"use client";

import ScrollStack, { ScrollStackItem } from "@/components/scroll-stack";
import { ListChecks, CalendarCheck, PartyPopper } from "lucide-react";

const etapes = [
  {
    num: 1,
    icon: ListChecks,
    title: "Choisissez votre formule",
    desc: "Classique, Bubble Foot ou Premium — selon l'âge des enfants, le budget et l'effet « waouh » recherché.",
    cardClass: "bg-gradient-to-br from-field to-field-dark text-white",
    badgeClass: "bg-white/20 text-white",
  },
  {
    num: 2,
    icon: CalendarCheck,
    title: "Réservez votre créneau",
    desc: "Date, salle et horaire en ligne en 2 minutes, avec paiement 100% sécurisé. Confirmation immédiate.",
    cardClass: "bg-gradient-to-br from-kick to-kick-dark text-white",
    badgeClass: "bg-white/20 text-white",
  },
  {
    num: 3,
    icon: PartyPopper,
    title: "Profitez, on s'occupe de tout",
    desc: "Animateur, terrain privatisé, goûter et déco sont prêts. Vous n'avez plus qu'à amener les enfants.",
    cardClass: "bg-white text-foreground border border-field/15",
    badgeClass: "bg-field/10 text-field",
  },
];

export default function EtapesStack() {
  return (
    <ScrollStack
      useWindowScroll
      itemDistance={80}
      itemStackDistance={28}
      itemScale={0.04}
      baseScale={0.88}
      stackPosition="22%"
      scaleEndPosition="12%"
    >
      {etapes.map((e) => (
        <ScrollStackItem
          key={e.num}
          itemClassName={`rounded-[2rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${e.cardClass}`}
        >
          <div className="flex items-center gap-6 md:gap-8">
            <div className={`flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-2xl ${e.badgeClass}`}>
              <e.icon className="size-8 md:size-10" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-70 font-[family-name:var(--font-heading)]">
                Étape {e.num}
              </p>
              <h3 className="mt-1 text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)]">
                {e.title}
              </h3>
              <p className="mt-2 text-base md:text-lg opacity-90 leading-relaxed max-w-xl">
                {e.desc}
              </p>
            </div>
          </div>
        </ScrollStackItem>
      ))}
    </ScrollStack>
  );
}
