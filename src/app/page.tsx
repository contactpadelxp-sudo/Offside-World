"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FadeIn, FadeInView, StaggerContainer, StaggerItem, Float, PulseGlow,
  MagneticButton, TextReveal, CountUp, Marquee, Tilt3D,
} from "@/components/motion";
import {
  Cake, CircleDot, Trophy, Building2, Star, MapPin, Baby, ShieldCheck,
  Sparkles, ArrowRight, Users, Clock, Zap, PartyPopper, ChevronRight,
  Quote,
} from "lucide-react";

const MagicRings = dynamic(() => import("@/components/magic-rings"), { ssr: false });

const marqueeItems = [
  "ANNIVERSAIRES", "BUBBLE FOOT", "TERRAIN PRIVÉ", "TEAM BUILDING",
  "FOUS RIRES", "FOOT INDOOR", "GOÛTER", "FUN",
];

export default function Home() {
  return (
    <>
      {/* ══════ HERO ══════ */}
      <section className="relative text-white min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#030a00]">
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

        {/* Dark overlay radial pour lisibilité au centre */}
        <div className="absolute inset-0 z-[1] bg-radial-[ellipse_at_center] from-[#030a00]/70 via-[#030a00]/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 lg:px-8 pt-28 pb-20 md:pt-36 md:pb-28 w-full text-center">
          {/* Headline central */}
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-tight leading-[1.05] drop-shadow-[0_2px_20px_rgba(0,0,0,0.7)]">
            <FadeIn delay={0.1} className="block whitespace-nowrap">
              <span>Le complexe où les</span>
            </FadeIn>
            <FadeIn delay={0.3} className="block whitespace-nowrap">
              <span>enfants </span>
              <span className="text-gradient-field">s&apos;éclatent</span>
              <span> et</span>
            </FadeIn>
            <FadeIn delay={0.5} className="block whitespace-nowrap">
              <span>les parents </span>
              <span className="text-gradient-field">soufflent.</span>
            </FadeIn>
          </h1>

          <FadeIn delay={0.9}>
            <p className="mt-6 text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              Organiser l&apos;anniversaire de votre enfant n&apos;a jamais été{" "}
              <span className="text-white/80 font-semibold">aussi simple.</span>
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1.1}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/reservation"
                className="btn-glass-field inline-flex items-center gap-2 text-white text-lg px-8 h-14 rounded-2xl"
              >
                Réserver maintenant
              </Link>
              <Link
                href="#activites"
                className="btn-glass-outline inline-flex items-center gap-2 text-white text-lg px-8 h-14 rounded-2xl"
              >
                Découvrir
              </Link>
            </div>
          </FadeIn>

          {/* Stats — espacées */}
          <FadeIn delay={1.3}>
            <div className="mt-20 flex justify-center gap-16 md:gap-24">
              {[
                { value: 2000, suffix: "+", label: "fêtes organisées" },
                { value: 3, suffix: "", label: "salles privatisées" },
                { value: 98, suffix: "%", label: "clients satisfaits" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs md:text-sm text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Scroll hint */}
        <FadeIn delay={1.5} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-white/30">
            <span className="text-[11px] tracking-widest uppercase">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>
        </FadeIn>
      </section>

      {/* ── Smooth transition hero → content ── */}
      <div className="relative h-32 -mt-1">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030a00] to-background" />
      </div>

      {/* ══════ MARQUEE ══════ */}
      <section className="py-8 overflow-hidden">
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
      <section id="activites" className="mx-auto max-w-6xl px-4 lg:px-8 py-20 md:py-28">
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
          <Tilt3D intensity={6}>
            <Link href="/reservation?activite=anniversaire" className="block">
              <div className="gradient-border">
                <div className="relative rounded-[0.9rem] overflow-hidden bg-gradient-to-br from-kick/8 via-white to-orange-50 p-8 md:p-10 group">
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
                        La formule parfaite pour un anniversaire inoubliable.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-kick font-semibold text-lg shrink-0 group-hover:gap-4 transition-all duration-300">
                      Réserver <ArrowRight className="size-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Tilt3D>
        </FadeInView>

        {/* ── 3 cartes côte à côte ── */}
        <StaggerContainer className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5" staggerDelay={0.1}>
          {([
            {
              href: "/reservation?activite=libre",
              icon: CircleDot,
              title: "Entrées libres",
              desc: "Sessions ouvertes à tous, ambiance garantie.",
              gradient: "from-field/8 via-white to-emerald-50",
              border: "border-field/10 hover:border-field/30",
              iconBg: "bg-field/10 text-field",
              accent: "text-field",
            },
            {
              href: "/reservation?activite=foot",
              icon: Trophy,
              title: "Location de terrain",
              desc: "Terrain privé avec éclairage, ballon et vestiaires.",
              gradient: "from-blue-50/60 via-white to-indigo-50/60",
              border: "border-blue-100 hover:border-blue-300",
              iconBg: "bg-blue-50 text-blue-600",
              accent: "text-blue-600",
            },
            {
              href: "/reservation?activite=team-building",
              icon: Building2,
              title: "Team Building",
              desc: "Événements sportifs de 10 à 40 personnes.",
              gradient: "from-violet-50/60 via-white to-purple-50/60",
              border: "border-violet-100 hover:border-violet-300",
              iconBg: "bg-violet-50 text-violet-600",
              accent: "text-violet-600",
            },
          ] as const).map((card) => (
            <StaggerItem key={card.href}>
              <Tilt3D className="h-full">
                <Link href={card.href} className="block h-full">
                  <div className={`relative h-full rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} p-6 border ${card.border} transition-all duration-500 flex flex-col justify-between group card-hover min-h-[220px]`}>
                    <div>
                      <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${card.iconBg} mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <card.icon className="size-6" />
                      </div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold">{card.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 ${card.accent} font-semibold text-sm mt-4 group-hover:gap-3 transition-all duration-300`}>
                      Réserver <ChevronRight className="size-4" />
                    </div>
                  </div>
                </Link>
              </Tilt3D>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── Smooth gradient transition → team building ── */}
      <div className="h-20 bg-gradient-to-b from-background to-[#f5f7f6]" />

      {/* ══════ TEAM BUILDING ══════ */}
      <section className="bg-[#f5f7f6] grain relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-20 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <FadeInView>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 mb-4">
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
              <div className="relative">
                <Tilt3D intensity={8}>
                  <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-field/20 via-kick/10 to-violet-200/30 flex items-center justify-center overflow-hidden border border-field/10 shadow-xl shadow-field/5">
                    <Float>
                      <div className="flex items-center gap-6 opacity-30">
                        <Building2 className="size-20 text-field" />
                        <CircleDot className="size-20 text-kick" />
                      </div>
                    </Float>
                    <span className="absolute bottom-5 right-5 text-xs text-muted-foreground bg-white/60 rounded-full px-3 py-1">[Photo à ajouter]</span>
                  </div>
                </Tilt3D>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ── Smooth gradient transition ── */}
      <div className="h-20 bg-gradient-to-b from-[#f5f7f6] to-background" />

      {/* ══════ RÉASSURANCE ══════ */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 py-16">
        <FadeInView>
          <h2 className="text-center font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold mb-14">
            Pourquoi <span className="text-gradient-field">Offside World</span> ?
          </h2>
        </FadeInView>
        <StaggerContainer className="grid grid-cols-2 gap-5 md:grid-cols-4" staggerDelay={0.1}>
          {[
            { icon: Star, title: "4.8/5", subtitle: "sur Google (200+ avis)", color: "bg-yellow-50 text-yellow-500 border-yellow-200" },
            { icon: MapPin, title: "Facile d'accès", subtitle: "Parking gratuit", color: "bg-blue-50 text-blue-500 border-blue-200" },
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

      {/* ══════ TESTIMONIAL ══════ */}
      <section className="mx-auto max-w-3xl px-4 lg:px-8 pb-20">
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
                  <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">— Sophie D., Google</span>
            </div>
          </div>
        </FadeInView>
      </section>

      {/* ── Smooth gradient transition → CTA ── */}
      <div className="h-20 bg-gradient-to-b from-background to-[#062e16]" />

      {/* ══════ CTA FINAL ══════ */}
      <section className="aurora-bg text-white relative overflow-hidden">
        <div className="field-pattern" />
        <div className="aurora-orb-3" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 lg:px-8 py-20 md:py-28 text-center">
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
