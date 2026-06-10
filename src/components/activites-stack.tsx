"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { Cake, CircleDot, Trophy, ArrowRight } from "lucide-react";
import "./scroll-stack.css";

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

const ITEM_STACK_DISTANCE = 30; // décalage en escalier entre cartes posées
const SCALE_STEP = 0.05;        // réduction des cartes du dessous à chaque pose
const DWELL = 260;              // scroll (px) pendant lequel l'empilement complet reste affiché

export default function ActivitesStack({ children }: { children?: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const area = areaRef.current;
    if (!wrapper || !area) return;

    let travel = 0;

    const cumOffsetTop = (el: HTMLElement) => {
      let top = 0;
      let node: HTMLElement | null = el;
      while (node) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const layout = () => {
      const vh = window.innerHeight;
      // position de la zone cartes dans le panneau sticky (son offsetParent)
      const areaTop = area.offsetTop;
      // distance qu'une carte parcourt du bas de l'écran à sa position posée
      travel = Math.max(vh - areaTop - 40, 200);
      // hauteur totale = 1 écran + l'arrivée des cartes 2 et 3 + temps de pause
      wrapper.style.height = `${vh + (cards.length - 1) * travel + DWELL}px`;
    };

    const update = () => {
      const vh = window.innerHeight;
      const range = wrapper.offsetHeight - vh;
      const y = Math.min(Math.max(window.scrollY - cumOffsetTop(wrapper), 0), range);

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const rest = i * ITEM_STACK_DISTANCE;
        // progression d'arrivée de la carte i (carte 0 déjà posée)
        const p = i === 0 ? 1 : Math.min(Math.max((y - (i - 1) * travel) / travel, 0), 1);
        const ty = rest + (1 - p) * travel;
        // les cartes du dessous se réduisent quand les suivantes se posent
        let scale = 1;
        for (let j = i + 1; j < cards.length; j++) {
          const pj = Math.min(Math.max((y - (j - 1) * travel) / travel, 0), 1);
          scale -= SCALE_STEP * pj;
        }
        card.style.transform = `translate3d(0, ${ty}px, 0) scale(${Math.round(scale * 1000) / 1000})`;
      });
    };

    layout();
    update();

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    });
    lenis.on("scroll", update);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const onResize = () => {
      layout();
      update();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener("resize", onResize);
      wrapper.style.height = "";
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Panneau épinglé : toute la section se fige pendant l'empilement */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-start pt-24 md:pt-28">
        {children}
        <div ref={areaRef} className="relative mx-auto w-full max-w-6xl px-4 lg:px-8 mt-4">
          {cards.map((card, i) => (
            <div
              key={card.href}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`scroll-stack-card ${i > 0 ? "inset-x-4 lg:inset-x-8" : ""} ${card.itemClassName}`}
              style={{
                transformOrigin: "top center",
                willChange: "transform",
                zIndex: i + 1,
                // inline pour battre le position:relative de .scroll-stack-card
                position: i > 0 ? "absolute" : undefined,
                top: i > 0 ? 0 : undefined,
                // hors écran avant la 1re mesure pour éviter tout flash au chargement
                transform: i > 0 ? "translate3d(0, 120vh, 0)" : undefined,
              }}
            >
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
