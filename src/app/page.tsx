"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FadeIn, FadeInView, StaggerContainer, StaggerItem, Float, PulseGlow,
  MagneticButton, CountUp, Marquee,
} from "@/components/motion";
import { formules } from "@/data/formules";
import {
  Cake, CircleDot, Trophy, Building2, Star, MapPin, Baby, ShieldCheck,
  Sparkles, ArrowRight, Users, Zap, PartyPopper, ChevronRight, ChevronDown,
  Quote, CalendarCheck, Gift, Crown, Check, Shirt, CakeSlice, Camera,
} from "lucide-react";

const marqueeItems = [
  "ANNIVERSAIRES", "BUBBLE FOOT", "TERRAIN PRIVÉ", "TEAM BUILDING",
  "FOUS RIRES", "FOOT INDOOR", "GOÛTER", "FUN",
];

const reviews = [
  {
    text: "L'anniversaire de Léa était juste parfait ! Les enfants se sont éclatés avec le Bubble Foot, l'équipe est super pro. On reviendra sans hésiter.",
    author: "Sophie D.",
    activity: "Anniversaire Bubble Foot",
  },
  {
    text: "Organisation au top du début à la fin. Le goûter était prêt, la salle décorée, on n'a eu à s'occuper de rien. Mon fils en parle encore !",
    author: "Karim B.",
    activity: "Anniversaire Premium",
  },
  {
    text: "On loue un terrain chaque semaine entre collègues. Toujours propre, ballon et chasubles fournis, réservation en 2 minutes.",
    author: "Thomas V.",
    activity: "Location de terrain",
  },
  {
    text: "Team building réussi pour nos 25 commerciaux. Tournoi super bien organisé, ambiance garantie, et le cocktail après-match était parfait.",
    author: "Caroline M.",
    activity: "Team Building",
  },
  {
    text: "Ma fille de 7 ans était timide, l'animateur a su l'intégrer tout de suite. Tous les parents m'ont demandé l'adresse en repartant !",
    author: "Julie R.",
    activity: "Anniversaire Classique",
  },
  {
    text: "Le rapport qualité-prix est imbattable. 18€ par enfant avec animateur, salle privée et espace goûter, on ne trouve pas mieux.",
    author: "Mehdi A.",
    activity: "Anniversaire Classique",
  },
];

const faqs = [
  {
    q: "À partir de quel âge peut-on réserver un anniversaire ?",
    a: "Nos formules anniversaire sont adaptées aux enfants dès 6 ans. La Salle Junior, avec ses mini-buts et ses protections en mousse, est spécialement pensée pour les plus petits (6-8 ans).",
  },
  {
    q: "Les parents peuvent-ils rester pendant l'anniversaire ?",
    a: "Bien sûr ! Un espace est prévu pour les parents qui souhaitent rester. Beaucoup en profitent pour souffler : l'animateur s'occupe de tout, du premier match au gâteau.",
  },
  {
    q: "Que se passe-t-il s'il pleut ?",
    a: "Rien ne change : tout notre complexe est 100% indoor. Pluie, vent ou canicule, l'anniversaire a lieu dans les mêmes conditions toute l'année.",
  },
  {
    q: "Peut-on apporter son propre gâteau ?",
    a: "Oui, vous pouvez apporter votre gâteau sans supplément. Si vous préférez ne vous occuper de rien, nous proposons un gâteau en option (35€, saveur au choix) ou inclus dans la formule Premium.",
  },
  {
    q: "Comment gérez-vous les allergies alimentaires ?",
    a: "Signalez-nous toute allergie lors de la réservation : nous adaptons le goûter et les boissons. Notre équipe est formée et vérifie systématiquement avant le service.",
  },
  {
    q: "Puis-je annuler ou modifier ma réservation ?",
    a: "Oui, l'annulation est gratuite jusqu'à 7 jours avant la date. Vous pouvez aussi déplacer votre créneau gratuitement en nous contactant par email ou téléphone.",
  },
];

const deroulement = [
  {
    icon: PartyPopper,
    title: "Accueil & équipement",
    desc: "L'animateur accueille les enfants, distribue les chasubles et lance l'échauffement en musique.",
    time: "15 min",
  },
  {
    icon: CircleDot,
    title: "Matchs & Bubble Foot",
    desc: "Tournoi encadré sur terrain privatisé. Avec les formules Bubble, place aux bulles géantes et aux fous rires.",
    time: "1h à 1h45",
  },
  {
    icon: CakeSlice,
    title: "Goûter & gâteau",
    desc: "Espace goûter privatisé et décoré. Gâteau, bougies et chanson — on s'occupe du service.",
    time: "30 min",
  },
  {
    icon: Camera,
    title: "Photo & souvenirs",
    desc: "Photo de groupe, remise des diplômes du meilleur buteur et départ avec des souvenirs plein la tête.",
    time: "15 min",
  },
];

function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-xl border-t border-black/[0.06] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">Anniversaire dès 18€/enfant</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="size-3 fill-yellow-400 text-yellow-400" /> 4.8/5 — annulation gratuite
          </p>
        </div>
        <Link
          href="/reservation?activite=anniversaire"
          className="btn-glass-kick inline-flex items-center gap-1.5 text-white text-sm px-5 h-11 rounded-xl shrink-0"
        >
          Réserver <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-field/10 bg-white overflow-hidden transition-all duration-300 hover:border-field/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold font-[family-name:var(--font-heading)]">{q}</span>
        <ChevronDown
          className={`size-5 text-field shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

const formuleMeta: Record<string, { icon: typeof Cake; badge?: string; cta: string }> = {
  classique: { icon: CircleDot, cta: "Choisir Classique" },
  "bubble-foot": { icon: PartyPopper, badge: "Le plus demandé", cta: "Choisir Bubble Foot" },
  premium: { icon: Crown, cta: "Choisir Premium" },
};

export default function Home() {
  return (
    <>
      {/* ══════ HERO — clair & festif ══════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden hero-festive">
        <div className="field-pattern-dark" />

        {/* Blobs décoratifs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-field/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-kick/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-field/10 blur-3xl pointer-events-none" />

        {/* Stickers flottants (desktop) */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden>
          <Float duration={3.5} className="absolute top-[18%] left-[10%]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-kick/10 border border-kick/10 rotate-[-8deg]">
              <Cake className="size-8 text-kick" />
            </div>
          </Float>
          <Float duration={4.2} className="absolute top-[28%] right-[12%]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-field/10 border border-field/10 rotate-[10deg]">
              <CircleDot className="size-8 text-field" />
            </div>
          </Float>
          <Float duration={3.8} className="absolute bottom-[24%] left-[16%]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl shadow-field/10 border border-field/10 rotate-[6deg]">
              <Gift className="size-7 text-field" />
            </div>
          </Float>
          <Float duration={4.5} className="absolute bottom-[30%] right-[15%]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl shadow-kick/10 border border-kick/10 rotate-[-6deg]">
              <PartyPopper className="size-7 text-kick" />
            </div>
          </Float>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 lg:px-8 pt-32 pb-20 md:pt-36 md:pb-24 w-full text-center">
          {/* Social proof above the fold */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-black/[0.05] shadow-sm px-4 py-2 text-sm font-medium">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </span>
              <span className="font-bold">4.8/5</span>
              <span className="text-muted-foreground">— 200+ avis Google</span>
            </div>
          </FadeIn>

          <h1 className="mt-8 font-[family-name:var(--font-heading)] text-[clamp(2.1rem,5.5vw,4.5rem)] font-bold tracking-tight leading-[1.08]">
            <FadeIn delay={0.1} className="block">
              <span>Le complexe où les enfants</span>
            </FadeIn>
            <FadeIn delay={0.3} className="block">
              <span className="text-gradient-kick">s&apos;éclatent</span>
              <span> et les parents </span>
              <span className="text-gradient-field">soufflent.</span>
            </FadeIn>
          </h1>

          <FadeIn delay={0.6}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Anniversaire foot ou Bubble Foot clé en main : salle privatisée, animateur,
              goûter… <span className="text-foreground font-semibold">dès 18€/enfant.</span>
            </p>
          </FadeIn>

          <FadeIn delay={0.8}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <MagneticButton>
                <Link
                  href="/reservation?activite=anniversaire"
                  className="btn-glass-kick inline-flex items-center gap-2 text-white text-lg px-8 h-14 rounded-2xl"
                >
                  <Cake className="size-5" />
                  Réserver un anniversaire
                </Link>
              </MagneticButton>
              <Link
                href="#formules"
                className="btn-outline-light inline-flex items-center gap-2 text-lg px-8 h-14 rounded-2xl"
              >
                Voir les formules
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-4 text-field" /> Annulation gratuite jusqu&apos;à 7 jours avant
            </p>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={1}>
            <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-6 sm:gap-x-16 md:gap-x-24">
              {[
                { value: 2000, suffix: "+", label: "fêtes organisées" },
                { value: 3, suffix: "", label: "salles privatisées" },
                { value: 98, suffix: "%", label: "clients satisfaits" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-gradient-field">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Scroll hint */}
        <FadeIn delay={1.3} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            <span className="text-[11px] tracking-widest uppercase">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-foreground/30 to-transparent animate-pulse" />
          </div>
        </FadeIn>
      </section>

      {/* ══════ MARQUEE ══════ */}
      <section className="py-8 overflow-hidden border-y border-field/5 bg-white">
        <Marquee speed={25} className="text-muted-foreground/50 font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold">
          <div className="flex items-center gap-8 px-4">
            {marqueeItems.map((item, i) => (
              <span key={i} className="flex items-center gap-4 whitespace-nowrap">
                {item}
                <Sparkles className="size-5 text-kick/50" />
              </span>
            ))}
          </div>
        </Marquee>
      </section>

      {/* ══════ ACTIVITÉS ══════ */}
      <section id="activites" className="mx-auto max-w-6xl px-4 lg:px-8 py-20 md:py-28 scroll-mt-20">
        <FadeInView>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
              <PartyPopper className="size-4" /> Nos activités
            </span>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
              Trois univers, <span className="text-gradient-field">un seul complexe</span>
            </h2>
          </div>
        </FadeInView>

        {/* ── Anniversaires — hero card pleine largeur ── */}
        <FadeInView>
          <Link href="/reservation?activite=anniversaire" className="block">
            <div className="gradient-border">
              <div className="relative rounded-[0.9rem] overflow-hidden bg-gradient-to-br from-kick/8 via-white to-field/5 p-8 md:p-10 group">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-kick/10 to-transparent rounded-bl-[6rem]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-field/5 to-transparent rounded-tr-[4rem]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-kick/10 p-4 text-kick shrink-0 self-start group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Cake className="size-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold">
                      Anniversaires
                    </h3>
                    <p className="mt-2 text-muted-foreground max-w-lg">
                      Foot, Bubble Foot, goûter privatisé et fous rires garantis.
                      La formule parfaite pour un anniversaire inoubliable — dès 18€/enfant.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-kick font-semibold text-lg shrink-0 group-hover:gap-4 transition-all duration-300">
                    Réserver <ArrowRight className="size-5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </FadeInView>

        {/* ── 3 cartes côte à côte ── */}
        <StaggerContainer className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5" staggerDelay={0.1}>
          {([
            {
              href: "/reservation?activite=libre",
              icon: CircleDot,
              title: "Entrées libres",
              desc: "Sessions ouvertes à tous dès 8€, ambiance garantie.",
            },
            {
              href: "/reservation?activite=foot",
              icon: Trophy,
              title: "Location de terrain",
              desc: "Terrain privé avec éclairage, ballon et vestiaires.",
            },
            {
              href: "/reservation?activite=team-building",
              icon: Building2,
              title: "Team Building",
              desc: "Événements sportifs de 10 à 40 personnes.",
            },
          ] as const).map((card) => (
            <StaggerItem key={card.href}>
              <Link href={card.href} className="block h-full">
                <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-field/8 via-white to-field/5 p-6 border border-field/10 hover:border-field/30 transition-all duration-500 flex flex-col justify-between group card-hover min-h-[200px]">
                  <div>
                    <div className="inline-flex items-center justify-center rounded-xl p-2.5 bg-field/10 text-field mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <card.icon className="size-6" />
                    </div>
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold">{card.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-field font-semibold text-sm mt-4 group-hover:gap-3 transition-all duration-300">
                    Réserver <ChevronRight className="size-4" />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ══════ FORMULES & PRIX ══════ */}
      <section id="formules" className="bg-[#f4f8f5] grain relative scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-20 md:py-28">
          <FadeInView>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-kick/10 px-4 py-1.5 text-sm font-semibold text-kick-dark mb-4">
                <Cake className="size-4" /> Formules anniversaire
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
                Des prix clairs, <span className="text-gradient-kick">zéro surprise</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Tout est inclus : salle privatisée, animateur et espace goûter.
                Vous n&apos;avez plus qu&apos;à apporter les enfants.
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid gap-6 md:grid-cols-3 items-stretch" staggerDelay={0.12}>
            {formules.map((f) => {
              const meta = formuleMeta[f.id];
              const isPopular = Boolean(meta?.badge);
              return (
                <StaggerItem key={f.id} className="h-full">
                  <div
                    className={`relative h-full flex flex-col rounded-3xl bg-white p-7 transition-all duration-500 card-hover ${
                      isPopular
                        ? "border-2 border-kick shadow-xl shadow-kick/10 md:-mt-3 md:mb-3"
                        : "border border-field/15"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-kick to-kick-dark text-white text-xs font-bold px-4 py-1.5 shadow-lg shadow-kick/20 whitespace-nowrap">
                        ⭐ {meta.badge}
                      </span>
                    )}
                    <div className={`inline-flex items-center justify-center rounded-2xl p-3 self-start ${isPopular ? "bg-kick/10 text-kick" : "bg-field/10 text-field"}`}>
                      {meta && <meta.icon className="size-7" />}
                    </div>
                    <h3 className="mt-4 text-xl font-bold font-[family-name:var(--font-heading)]">{f.name}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                    <p className="mt-5">
                      <span className={`text-4xl font-bold font-[family-name:var(--font-heading)] ${isPopular ? "text-kick" : "text-field"}`}>
                        {f.pricePerChild}€
                      </span>
                      <span className="text-muted-foreground text-sm"> /enfant</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {f.durationMinutes / 60}h • {f.minChildren} à {f.maxChildren} enfants
                    </p>
                    <ul className="mt-5 space-y-2 flex-1">
                      {f.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-sm">
                          <Check className={`size-4 mt-0.5 shrink-0 ${isPopular ? "text-kick" : "text-field"}`} />
                          {inc}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/reservation?activite=anniversaire&formule=${f.id}`}
                      className={`mt-7 inline-flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-white ${
                        isPopular ? "btn-glass-kick" : "btn-glass-field"
                      }`}
                    >
                      {meta?.cta ?? "Choisir"} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeInView delay={0.2}>
            <p className="mt-10 text-center text-sm text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-field" /> Annulation gratuite jusqu&apos;à 7 jours</span>
              <span className="flex items-center gap-1.5"><Shirt className="size-4 text-field" /> Chasubles & équipement fournis</span>
              <span className="flex items-center gap-1.5"><CalendarCheck className="size-4 text-field" /> Réservation en 2 minutes</span>
            </p>
          </FadeInView>
        </div>
      </section>

      {/* ══════ DÉROULÉ D'UN ANNIVERSAIRE ══════ */}
      <section className="mx-auto max-w-6xl px-4 lg:px-8 py-20 md:py-28">
        <FadeInView>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
              <CalendarCheck className="size-4" /> Comment ça se passe
            </span>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
              Un anniversaire <span className="text-gradient-field">clé en main</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Vous arrivez, on s&apos;occupe de tout. Voici le déroulé type d&apos;une fête chez nous.
            </p>
          </div>
        </FadeInView>

        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
          {deroulement.map((s, i) => (
            <StaggerItem key={s.title} className="h-full">
              <div className="relative h-full rounded-2xl border border-field/10 bg-white p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center rounded-xl bg-field/10 text-field p-3">
                    <s.icon className="size-6" />
                  </div>
                  <span className="text-5xl font-bold font-[family-name:var(--font-heading)] text-field/10">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-bold font-[family-name:var(--font-heading)] text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-kick bg-kick/10 rounded-full px-3 py-1">
                  {s.time}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInView delay={0.2}>
          <div className="mt-12 text-center">
            <MagneticButton className="inline-block">
              <Link
                href="/reservation?activite=anniversaire"
                className="btn-glass-kick inline-flex items-center gap-2 text-white px-8 h-13 rounded-2xl text-base"
              >
                Organiser cet anniversaire <ArrowRight className="size-5" />
              </Link>
            </MagneticButton>
          </div>
        </FadeInView>
      </section>

      {/* ══════ TEAM BUILDING ══════ */}
      <section className="bg-[#f4f8f5] grain relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-20 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <FadeInView>
              <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
                <Building2 className="size-4" /> Entreprises
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold leading-tight">
                Team Building<br /><span className="text-gradient-field">sportif</span>
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
                Tournoi de foot, Bubble Foot entre collègues, cocktail dînatoire…
                On organise tout. Disponible les <strong>lundi, mardi, jeudi et samedi dès 18h</strong>.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: "10 à 40 personnes" },
                  { icon: Sparkles, label: "3 formules" },
                  { icon: Building2, label: "Salle privatisée" },
                  { icon: Zap, label: "Devis sur mesure" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-field/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-field/10 text-field shrink-0">
                      <item.icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <MagneticButton className="inline-block mt-8">
                <Link
                  href="/reservation?activite=team-building"
                  className="btn-glass-field inline-flex items-center gap-2 text-white px-7 h-13 rounded-2xl text-base"
                >
                  Organiser mon événement <ArrowRight className="size-5" />
                </Link>
              </MagneticButton>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-field/20 via-kick/10 to-field/10 flex items-center justify-center overflow-hidden border border-field/10 shadow-xl shadow-field/5 relative">
                <Float>
                  <div className="flex items-center gap-6 opacity-30">
                    <Building2 className="size-20 text-field" />
                    <CircleDot className="size-20 text-kick" />
                  </div>
                </Float>
                <span className="absolute bottom-5 right-5 text-xs text-muted-foreground bg-white/60 rounded-full px-3 py-1">[Photo à ajouter]</span>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ══════ RÉASSURANCE ══════ */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <FadeInView>
          <h2 className="text-center font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold mb-14">
            Pourquoi <span className="text-gradient-field">Offside World</span> ?
          </h2>
        </FadeInView>
        <StaggerContainer className="grid grid-cols-2 gap-5 md:grid-cols-4" staggerDelay={0.1}>
          {[
            { icon: Star, title: "4.8/5", subtitle: "sur Google (200+ avis)", color: "bg-yellow-50 text-yellow-500 border-yellow-200" },
            { icon: MapPin, title: "Facile d'accès", subtitle: "Parking gratuit", color: "bg-field/5 text-field border-field/20" },
            { icon: Baby, title: "Dès 6 ans", subtitle: "Encadrement adapté", color: "bg-kick/10 text-kick border-kick/20" },
            { icon: ShieldCheck, title: "100% sécurisé", subtitle: "Paiement via PayPal", color: "bg-field/10 text-field border-field/20" },
          ].map((item) => (
            <StaggerItem key={item.title}>
              <div className={`text-center p-6 rounded-2xl border ${item.color} group hover:shadow-lg transition-all duration-500`}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="size-7" />
                </div>
                <p className="mt-4 text-lg font-bold font-[family-name:var(--font-heading)]">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ══════ AVIS CLIENTS ══════ */}
      <section id="avis" className="bg-[#f4f8f5] grain relative scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-20 md:py-28">
          <FadeInView>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-700 mb-4">
                <Star className="size-4 fill-yellow-500 text-yellow-500" /> Ils nous recommandent
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
                200+ familles <span className="text-gradient-field">conquises</span>
              </h2>
            </div>
          </FadeInView>

          <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
            {reviews.map((r) => (
              <StaggerItem key={r.author} className="h-full">
                <div className="h-full flex flex-col rounded-2xl bg-white border border-field/10 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="size-6 text-field/20" />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80 flex-1">&ldquo;{r.text}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-field/5">
                    <p className="text-sm font-bold">{r.author}</p>
                    <p className="text-xs text-muted-foreground">{r.activity} · Avis Google</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 lg:px-8 py-20 md:py-28 scroll-mt-20">
        <FadeInView>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
              Questions fréquentes
            </span>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold">
              Les parents nous demandent <span className="text-gradient-field">souvent…</span>
            </h2>
          </div>
        </FadeInView>
        <FadeInView delay={0.1}>
          <div className="space-y-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </FadeInView>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="aurora-bg text-white relative overflow-hidden">
        <div className="field-pattern" />
        <div className="aurora-orb-3" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 lg:px-8 py-20 md:py-28 text-center">
          <FadeInView>
            <div className="glass mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-8">
              <PartyPopper className="size-8" />
            </div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
              Prêt à faire des heureux ?
            </h2>
            <p className="mt-5 text-white/80 text-lg">
              Anniversaire, match entre amis ou team building — trouvez votre créneau en 2 minutes.
            </p>
            <MagneticButton className="inline-block mt-10">
              <PulseGlow>
                <Link
                  href="/reservation"
                  className="btn-glass-kick inline-flex items-center gap-2.5 text-white text-lg px-10 h-14 rounded-2xl"
                >
                  <Zap className="size-5" />
                  C&apos;est parti !
                  <ArrowRight className="size-5" />
                </Link>
              </PulseGlow>
            </MagneticButton>
            <p className="mt-6 text-sm text-white/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-4" /> Annulation gratuite jusqu&apos;à 7 jours avant la date
            </p>
          </FadeInView>
        </div>
      </section>

      <StickyMobileCTA />
    </>
  );
}
