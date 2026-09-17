"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import Lenis from "lenis";
import { FlecheDroite, Gateau, Groupe, Trophee } from "@/components/icons";
import { Photo } from "@/components/photo";
import { usePhoto } from "@/components/photos-provider";
import { hrefActivite } from "@/data/activites";
import "./scroll-stack.css";

type Card = {
  href: string;
  icon: typeof Gateau;
  title: string;
  desc: string;
  itemClassName: string;
  badgeClass: string;
  ctaClass: string;
  frameClass: string;
  img: string | null;
  /** Cadrage de la photo dans le cadre paysage (utile pour les images portrait). */
  imgPosition?: string;
};


const ITEM_STACK_DISTANCE = 30; // décalage en escalier entre cartes posées
const SCALE_STEP = 0.05;        // réduction des cartes du dessous à chaque pose
const DWELL = 260;              // scroll (px) pendant lequel l'empilement complet reste affiché

/*
  L'EMPILEMENT DEMANDE DE LA LARGEUR **ET** DE LA HAUTEUR. LES DEUX SONT MESURÉES.

  ── La largeur : 768 px ──
  Sur un écran de 375 px, la mécanique coûtait 2152 px de hauteur pour trois
  cartes qui en font 350 : le panneau épinglé réserve un écran entier plus la
  course d'arrivée de chaque carte, soit près de 1700 px de noir vide qu'il faut
  traverser au doigt. La section pesait à elle seule un quart de la page.

  S'y ajoutait Lenis, instancié ici mais branché sur `window` : il remplaçait le
  défilement natif de TOUTE la page par un défilement interpolé, y compris au
  doigt (`syncTouch`). Sur téléphone c'est un net recul — le pouce pousse, la
  page suit avec un temps de retard, et l'inertie du système ne s'applique plus.

  ── La hauteur : 700 px ──
  Ce panneau est `h-screen overflow-hidden`. Quand la fenêtre est BASSE, il ne
  déborde pas : il COUPE. Et comme il est épinglé, défiler ne fait pas
  descendre ce qui est coupé — ça fait avancer l'animation. Le contenu perdu
  est donc perdu pour de bon.

  Mesuré au navigateur : le contenu tient à partir de 660 px de haut, et pas en
  dessous — 640 px en perd 12, 600 px en perd 52, 560 px en perd 92. Le seuil
  est identique à 768, 1024 et 1280 px de large : c'est bien la hauteur seule
  qui décide. On prend 700 px pour garder de la marge si le titre se replie
  autrement.

  Ce que ça change concrètement : un téléphone tenu à l'horizontale fait 375 à
  430 px de haut pour 667 à 932 px de large. Il passait donc la condition de
  largeur, et la section « Nos activités » s'y résumait à son titre et au liseré
  supérieur d'une carte — les trois activités, leurs descriptions et leurs
  boutons « Réserver » étaient invisibles et inatteignables. Idem pour toute
  fenêtre de bureau réduite en hauteur.

  ── Une seule source de vérité ──
  Les classes `md:sticky md:h-screen` ont disparu du JSX au profit de cette
  condition : une media query CSS ne peut pas exprimer la même règle sans la
  recopier, et deux copies d'un seuil finissent toujours par diverger.
*/
const SEUIL_EMPILEMENT = "(min-width: 768px) and (min-height: 700px)";

/** `true` si l'écran a la place — en largeur et en hauteur — pour l'empilement épinglé. */
function useEmpilement(): boolean {
  // Ce composant est monté avec `ssr: false` : `window` existe toujours ici.
  const [actif, setActif] = useState(
    () => typeof window !== "undefined" && window.matchMedia(SEUIL_EMPILEMENT).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(SEUIL_EMPILEMENT);
    const suivre = () => setActif(mq.matches);
    suivre();
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);

  return actif;
}

export default function ActivitesStack({ children }: { children?: React.ReactNode }) {
  const photoTerrain = usePhoto("terrain-vide");
  const photoBubble = usePhoto("bubble-portrait");
  /*
    Cette carte affichait `/images/foot.jpeg`, écrit en dur, seule des six
    cartes d'activité du site à contourner le système d'emplacements de
    `lib/photos.ts`. Ce système existe pour que Brahim change une photo en
    déposant un fichier dans `public/images` : cette carte-là ne l'écoutait pas,
    et personne ne s'en serait aperçu avant qu'il essaie et que rien ne change.
  */
  const photoAnniv = usePhoto("anniversaire-carte");

  const cards: Card[] = [
    {
      href: hrefActivite("anniversaire"),
      icon: Gateau,
      title: "Anniversaires",
      /*
        LA VIDÉO SOUVENIR N'EST PLUS PROMISE ICI.

        Cette phrase annonçait « vidéo souvenir de l'anniversaire comprise »
        sans aucune condition — une promesse commerciale ferme, sur la page
        d'accueil. Brahim l'a retirée des formules le 17 septembre 2026 : la
        laisser serait une pratique trompeuse au sens de l'article VI.97 du
        Code de droit économique, et surtout une prestation que le client
        réclamerait à juste titre.

        La clause 15 des CGV, elle, reste : elle est conditionnelle
        (« lorsqu'une telle fonctionnalité fait partie de la prestation ») et
        encadre l'autorisation parentale pour l'image des mineurs. Retirer une
        protection parce que la prestation n'est plus vendue serait le mauvais
        raisonnement — les caméras du complexe, elles, n'ont pas disparu.
      */
      desc: "Deux formules 100 % foot, Kick-Off et Bubble. Décoration, boissons et espace gâteau compris.",
      itemClassName: "bg-gradient-to-br from-field to-kick text-[#0a0a0b]",
      badgeClass: "bg-black/15 text-[#0a0a0b]",
      ctaClass: "text-[#0a0a0b]",
      frameClass: "border-black/25 bg-black/10",
      img: photoAnniv,
    },
    {
      href: hrefActivite("foot"),
      icon: Trophee,
      title: "Louer un terrain",
      desc: "Terrain privé avec éclairage, ballon, chasubles et vestiaires. Réservez votre créneau entre amis.",
      itemClassName: "bg-[#151517] text-foreground border border-white/10",
      badgeClass: "bg-field/15 text-field",
      ctaClass: "text-field",
      frameClass: "border-field/30 bg-field/5",
      img: photoTerrain,
    },
    {
      href: hrefActivite("groupes"),
      icon: Groupe,
      title: "Bubble Foot & Team Building",
      desc: "Le foot dans des bulles géantes entre amis, ou la privatisation du complexe à la demi-journée pour votre équipe.",
      itemClassName: "bg-gradient-to-br from-kick to-kick-dark text-[#0a0a0b]",
      badgeClass: "bg-black/15 text-[#0a0a0b]",
      ctaClass: "text-[#0a0a0b]",
      frameClass: "border-black/25 bg-black/10",
      img: photoBubble,
      // Photo portrait dans un cadre paysage : on cadre sur la bande où se
      // trouvent les bulles, à environ 54 % de la hauteur de l'image.
      imgPosition: "object-[center_54%]",
    },
  ];

  const wrapperRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const empile = useEmpilement();
  const nbCartes = cards.length;
  /*
    Lenis remplace le défilement natif de TOUTE la page par un défilement
    interpolé : la page continue de glisser après que le doigt ou la molette
    se sont arrêtés. C'est exactement le genre de mouvement que le réglage
    « réduire les animations » demande de supprimer — et c'est aussi celui qui
    désoriente le plus, puisqu'il détourne un geste que l'utilisateur croit
    contrôler. On rend alors la main au navigateur ; l'empilement, lui, continue
    de fonctionner, simplement piloté par le défilement natif.
  */
  const moinsDeMouvement = useReducedMotion();

  useEffect(() => {
    if (!empile) return;
    const wrapper = wrapperRef.current;
    const area = areaRef.current;
    if (!wrapper || !area) return;

    /*
      Le tableau de références est capturé ICI, pas dans le nettoyage. React
      remplace `cardRefs.current` à chaque rendu : le nettoyage, qui s'exécute
      plus tard, y trouverait un autre tableau que celui dont il doit défaire
      les transformations.
    */
    const cartes = cardRefs.current;

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
      wrapper.style.height = `${vh + (nbCartes - 1) * travel + DWELL}px`;
    };

    const update = () => {
      const vh = window.innerHeight;
      const range = wrapper.offsetHeight - vh;
      const y = Math.min(Math.max(window.scrollY - cumOffsetTop(wrapper), 0), range);

      cartes.forEach((card, i) => {
        if (!card) return;
        const rest = i * ITEM_STACK_DISTANCE;
        // progression d'arrivée de la carte i (carte 0 déjà posée)
        const p = i === 0 ? 1 : Math.min(Math.max((y - (i - 1) * travel) / travel, 0), 1);
        const ty = rest + (1 - p) * travel;
        // les cartes du dessous se réduisent quand les suivantes se posent
        let scale = 1;
        for (let j = i + 1; j < nbCartes; j++) {
          const pj = Math.min(Math.max((y - (j - 1) * travel) / travel, 0), 1);
          scale -= SCALE_STEP * pj;
        }
        card.style.transform = `translate3d(0, ${ty}px, 0) scale(${Math.round(scale * 1000) / 1000})`;
      });
    };

    layout();
    update();

    const lenis = moinsDeMouvement ? null : new Lenis({
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
    if (lenis) lenis.on("scroll", update);
    else window.addEventListener("scroll", update, { passive: true });

    let rafId = 0;
    if (lenis) {
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    const onResize = () => {
      layout();
      update();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      else window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      wrapper.style.height = "";
      // En repassant sous 768 px, les cartes doivent retrouver leur place dans
      // le flux : la dernière transformation posée les laisserait décalées.
      cartes.forEach((card) => { if (card) card.style.transform = ""; });
    };
  }, [empile, nbCartes, moinsDeMouvement]);

  return (
    <div ref={wrapperRef} className="relative">
      {/*
        Le panneau ne s'épingle QUE si `empile` le permet — pas sur un simple
        `md:`. Voir `SEUIL_EMPILEMENT` : épingler sans avoir la hauteur revient
        à couper le contenu sans aucun moyen d'y accéder.

        `overflow-hidden` reste dans les deux cas : sans lui, les ronds
        décoratifs qui débordent à droite (`-right-48`) feraient défiler la page
        à l'horizontale.
      */}
      <div
        className={`relative overflow-hidden flex flex-col justify-start ${
          empile ? "sticky top-0 h-screen pt-28" : "py-14"
        }`}
      >
        {/* Décor graphique de fond (rond central, points, halos) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-48 top-16 w-[30rem] h-[30rem] rounded-full border-2 border-field/15" />
          <div className="absolute -right-28 top-36 w-72 h-72 rounded-full border-2 border-field/15" />
          <div className="absolute -right-8 top-56 w-32 h-32 rounded-full bg-field/[0.06]" />
          <div className="absolute left-6 md:left-12 top-32 w-44 h-44 dot-grid fade-mask-radial" />
          <div className="absolute -left-28 bottom-12 w-80 h-80 rounded-full bg-field/15 blur-3xl" />
          <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full border-2 border-dashed border-field/20" />
        </div>
        {children}
        <div
          ref={areaRef}
          className={`relative mx-auto w-full max-w-6xl px-4 lg:px-8 ${
            empile ? "mt-4 block" : "mt-8 flex flex-col gap-4"
          }`}
        >
          {cards.map((card, i) => (
            <div
              key={card.href}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`scroll-stack-card ${empile && i > 0 ? "inset-x-4 lg:inset-x-8" : ""} ${card.itemClassName}`}
              style={{
                transformOrigin: "top center",
                // `will-change: transform` réserve une couche de composition. Sur
                // téléphone plus rien ne bouge : la réserver coûterait de la
                // mémoire graphique pour une animation qui n'a pas lieu.
                willChange: empile ? "transform" : undefined,
                zIndex: i + 1,
                // inline pour battre le position:relative de .scroll-stack-card
                position: empile && i > 0 ? "absolute" : undefined,
                top: empile && i > 0 ? 0 : undefined,
                // hors écran avant la 1re mesure pour éviter tout flash au chargement
                transform: empile && i > 0 ? "translate3d(0, 120vh, 0)" : undefined,
              }}
            >
              <div className="flex h-full items-stretch gap-4 md:gap-8">
                <div className="flex h-full flex-1 flex-col justify-between gap-5 min-w-0">
                  <div className="flex items-start gap-3.5 md:gap-6">
                    <div className={`flex h-11 w-11 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-xl md:rounded-2xl ${card.badgeClass}`}>
                      <card.icon className="size-6 md:size-8" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)] text-balance">
                        {card.title}
                      </h2>
                      <p className="mt-2 md:mt-3 text-sm sm:text-base md:text-lg opacity-90 leading-relaxed max-w-xl">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={card.href}
                    className={`inline-flex min-h-11 items-center gap-2 font-semibold text-base md:text-lg ${card.ctaClass} hover:gap-4 transition-all duration-300 self-start`}
                  >
                    Réserver <FlecheDroite className="size-5" />
                  </Link>
                </div>
                {/* Cadre photo (même taille pour les 3 cartes) */}
                <div className={`relative hidden md:block h-full w-64 lg:w-80 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed ${card.frameClass}`}>
                  {card.img && (
                    <Photo
                      src={card.img}
                      alt={card.title}
                      sizes="(max-width: 1024px) 40vw, 320px"
                      className={`object-cover ${card.imgPosition ?? "object-center"}`}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
