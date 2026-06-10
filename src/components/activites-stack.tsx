"use client";

import Link from "next/link";
import ScrollStack, { ScrollStackItem } from "@/components/scroll-stack";
import { Cake, CircleDot, Trophy, ArrowRight } from "lucide-react";

const cards = [
  {
    href: "/reservation?activite=anniversaire",
    icon: Cake,
    title: "Anniversaires",
    desc: "Foot, Bubble Foot, goûter privatisé et fous rires garantis. La formule parfaite pour un anniversaire inoubliable.",
    itemClassName: "bg-gradient-to-br from-kick to-kick-dark text-white",
    badgeClass: "bg-white/20 text-white",
    ctaClass: "text-white",
  },
  {
    href: "/reservation?activite=libre",
    icon: CircleDot,
    title: "Entrées libres",
    desc: "Sessions ouvertes à tous, ambiance garantie. Venez seul ou entre amis, on s'occupe du reste.",
    itemClassName: "bg-gradient-to-br from-field to-field-dark text-white",
    badgeClass: "bg-white/20 text-white",
    ctaClass: "text-white",
  },
  {
    href: "/reservation?activite=foot",
    icon: Trophy,
    title: "Location de terrain",
    desc: "Terrain privé avec éclairage, ballon et vestiaires. Réservez votre créneau entre amis.",
    itemClassName: "bg-white text-foreground border border-field/15",
    badgeClass: "bg-field/10 text-field",
    ctaClass: "text-field",
  },
];

export default function ActivitesStack() {
  return (
    <ScrollStack useWindowScroll itemDistance={20}>
      {cards.map((card) => (
        <ScrollStackItem key={card.href} itemClassName={card.itemClassName}>
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start gap-6">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${card.badgeClass}`}>
                <card.icon className="size-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)]">
                  {card.title}
                </h2>
                <p className="mt-3 text-base md:text-lg opacity-90 leading-relaxed max-w-xl">
                  {card.desc}
                </p>
              </div>
            </div>
            <Link
              href={card.href}
              className={`inline-flex items-center gap-2 font-semibold text-lg ${card.ctaClass} hover:gap-4 transition-all duration-300 self-start`}
            >
              Réserver <ArrowRight className="size-5" />
            </Link>
          </div>
        </ScrollStackItem>
      ))}
    </ScrollStack>
  );
}
