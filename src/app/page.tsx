"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FadeIn, FadeInView, StaggerContainer, StaggerItem, PulseGlow,
  MagneticButton, CountUp, Marquee, Tilt3D, WaveDivider,
} from "@/components/motion";
import { FrameImage } from "@/components/frame-image";
import {
  Building2, Star, MapPin, Baby, ShieldCheck,
  Sparkles, ArrowRight, Users, Clock, Zap, PartyPopper,
  Quote,
} from "lucide-react";

const MagicRings = dynamic(() => import("@/components/magic-rings"), { ssr: false });

const ActivitesStack = dynamic(() => import("@/components/activites-stack"), { ssr: false });

const marqueeItems = [
  "ANNIVERSAIRES", "BUBBLE FOOT", "TERRAIN PRIVÉ", "TEAM BUILDING",
  "FOUS RIRES", "FOOT INDOOR", "GOÛTER", "FUN",
];

export default function Home() {
  return (
    <>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-white">
        {/* MagicRings background */}
        <div className="absolute inset-0 z-0">
          <MagicRings
            color="#33ff00"
            colorTwo="#00d11b"
            ringCount={6}
            speed={1}
            attenuation={10}
            lineThickness={2}
            baseRadius={0.35}
            radiusStep={0.1}
            scaleRate={0.1}
            opacity={1}
            blur={0}
            noiseAmount={0.1}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0.2}
            hoverScale={1.2}
            parallax={0.05}
            clickBurst={false}
          />
        </div>
        <div className="grain" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />

        {/* Overlay radial blanc pour lisibilité au centre */}
        <div className="absolute inset-0 z-[1] bg-radial-[ellipse_at_center] from-white/80 via-white/50 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 lg:px-8 pt-28 pb-14 md:pt-32 md:pb-16 w-full text-center">
          {/* Headline central */}
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-tight leading-[1.05] text-foreground">
            <FadeIn delay={0.1} className="block md:whitespace-nowrap">
              <span>Le complexe où les</span>
            </FadeIn>
            <FadeIn delay={0.3} className="block md:whitespace-nowrap">
              <span>enfants </span>
              <span className="text-gradient-field">s&apos;éclatent</span>
              <span> et</span>
            </FadeIn>
            <FadeIn delay={0.5} className="block md:whitespace-nowrap">
              <span>les parents </span>
              <span className="text-gradient-field">soufflent.</span>
            </FadeIn>
          </h1>

          <FadeIn delay={0.9}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Organiser l&apos;anniversaire de votre enfant n&apos;a jamais été{" "}
              <span className="text-foreground font-semibold">aussi simple.</span>
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1.1}>
            <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 px-2">
              <Link
                href="/reservation"
                className="btn-glass-field inline-flex items-center justify-center gap-2 text-white text-lg px-8 h-14 rounded-2xl"
              >
                Réserver maintenant
              </Link>
              <Link
                href="#activites"
                className="btn-outline-light inline-flex items-center justify-center gap-2 text-lg px-8 h-14 rounded-2xl"
              >
                Découvrir
              </Link>
            </div>
          </FadeIn>

          {/* Stats — espacées */}
          <FadeIn delay={1.3}>
            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-6 sm:gap-x-16 md:gap-x-24">
              {[
                { value: 2000, suffix: "+", label: "fêtes organisées" },
                { value: 3, suffix: "", label: "salles privatisées" },
                { value: 98, suffix: "%", label: "clients satisfaits" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-foreground">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Cadre d'aperçu du complexe */}
          <FadeIn delay={1.5}>
            <div className="relative mt-12 mx-auto w-full max-w-3xl aspect-[16/9] overflow-hidden rounded-3xl border-2 border-dashed border-field/30 bg-white/40 backdrop-blur-sm shadow-xl shadow-field/5 flex items-center justify-center">
              <span className="text-sm text-muted-foreground/70 tracking-wide">Aperçu du complexe — photo à venir</span>
              <FrameImage base="accueil" alt="Le complexe Offside World" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </FadeIn>
        </div>

        {/* Scroll hint */}
        <FadeIn delay={1.5} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
            <span className="text-[11px] tracking-widest uppercase">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-foreground/30 to-transparent animate-pulse" />
          </div>
        </FadeIn>
      </section>

      {/* ── Vague de transition hero → marquee ── */}
      <WaveDivider fill="#eef3f0" className="-mt-1 relative z-10" />

      {/* ══════ MARQUEE ══════ */}
      <section className="py-5 overflow-hidden bg-[#eef3f0]">
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

      {/* ── Vague de sortie marquee → activités ── */}
      <WaveDivider fill="#eef3f0" flip />

      {/* ══════ ACTIVITÉS — section épinglée pendant l'empilement ══════ */}
      <section id="activites">
        <ActivitesStack>
          <FadeInView>
            <div className="text-center max-w-2xl mx-auto px-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
                <PartyPopper className="size-4" /> Nos activités
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
                Trois univers, <span className="text-gradient-field">un seul complexe</span>
              </h2>
            </div>
          </FadeInView>
        </ActivitesStack>
      </section>

      {/* ── Vague de transition → team building ── */}
      <WaveDivider fill="#eef3f0" />

      {/* ══════ TEAM BUILDING ══════ */}
      <section className="bg-[#eef3f0] grain relative overflow-hidden">
        {/* Décor : demi rond central + points + halo */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-field/15" />
          <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-field/10" />
          <div className="absolute right-10 bottom-8 w-44 h-44 dot-grid fade-mask-radial" />
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-field/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-12 md:py-16">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <FadeInView>
              <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field-dark mb-4">
                <Building2 className="size-4" /> Entreprises
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold leading-tight">
                Vous êtes une <span className="text-gradient-field">entreprise&nbsp;?</span>
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
                Venez vivre un team building sportif qui soude vos équipes :
                tournoi de foot, Bubble Foot entre collègues, cocktail dînatoire…
                On organise tout de A à Z. Disponible les <strong>lundi, mardi, jeudi et samedi dès 18h</strong>.
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
              <div className="relative">
                <Tilt3D intensity={8}>
                  <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-field/20 via-white to-field/10 overflow-hidden border border-field/10 shadow-xl shadow-field/5">
                    <FrameImage base="offside-foot-indoor" alt="Team building sportif à Offside World — foot indoor entre collègues" className="h-full w-full object-cover" />
                  </div>
                </Tilt3D>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ── Vague de transition → réassurance ── */}
      <WaveDivider fill="#eef3f0" flip />

      {/* ══════ RÉASSURANCE ══════ */}
      <section className="relative overflow-hidden">
        {/* Décor : lignes de terrain + halos latéraux */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="field-pattern-green" />
          <div className="absolute -left-24 top-1/3 w-72 h-72 rounded-full bg-field/5 blur-3xl" />
          <div className="absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-field/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-10 md:py-12">
        <FadeInView>
          <h2 className="text-center font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold mb-10">
            Pourquoi <span className="text-gradient-field">Offside World</span> ?
          </h2>
        </FadeInView>
        <StaggerContainer className="grid grid-cols-2 gap-5 md:grid-cols-4" staggerDelay={0.1}>
          {[
            { icon: Star, title: "4.8/5", subtitle: "sur Google (200+ avis)", color: "bg-field/10 text-field border-field/20" },
            { icon: MapPin, title: "Facile d'accès", subtitle: "Parking gratuit", color: "bg-white text-field-dark border-field/15" },
            { icon: Baby, title: "Dès 6 ans", subtitle: "Encadrement adapté", color: "bg-kick/10 text-kick border-kick/20" },
            { icon: ShieldCheck, title: "100% sécurisé", subtitle: "Paiement via PayPal", color: "bg-field/5 text-field border-field/20" },
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
        </div>
      </section>

      {/* ══════ TESTIMONIAL ══════ */}
      <section className="relative overflow-hidden">
        {/* Décor : anneaux en coin + points */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border-2 border-dashed border-field/15" />
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-2 border-field/10" />
          <div className="absolute left-6 bottom-0 w-36 h-36 dot-grid fade-mask-radial" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 lg:px-8 pt-4 pb-12">
        <FadeInView>
          <div className="relative rounded-3xl bg-gradient-to-br from-field/5 to-kick/5 border border-field/10 p-8 md:p-12 text-center">
            <Quote className="size-10 text-field/40 mx-auto mb-4" />
            <blockquote className="text-lg md:text-xl font-medium leading-relaxed text-foreground/80 italic">
              &ldquo;L&apos;anniversaire de Léa était juste parfait ! Les enfants se sont éclatés
              avec le Bubble Foot, l&apos;équipe est super pro. On reviendra sans hésiter.&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-field text-field" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">— Sophie D., Google</span>
            </div>
          </div>
        </FadeInView>
        </div>
      </section>

      {/* ── Vague de transition → CTA ── */}
      <WaveDivider fill="#062e16" />

      {/* ══════ CTA FINAL ══════ */}
      <section className="aurora-bg text-white relative overflow-hidden">
        <div className="field-pattern" />
        <div className="aurora-orb-3" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 lg:px-8 py-14 md:py-20 text-center">
          <FadeInView>
            <div className="glass mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-8">
              <Clock className="size-8" />
            </div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
              Prêt à réserver ?
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
          </FadeInView>
        </div>
      </section>
    </>
  );
}
