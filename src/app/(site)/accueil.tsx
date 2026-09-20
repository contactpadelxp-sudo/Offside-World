"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FadeIn, FadeInView, StaggerContainer, StaggerItem, PulseGlow,
  MagneticButton, Marquee, Tilt3D, WaveDivider,
} from "@/components/motion";
import { Photo } from "@/components/photo";
import { ActivitesHero } from "@/components/activites/activites-hero";
import { useActivites } from "@/components/activites/use-activites";
import { hrefActivite } from "@/data/activites";
import { euros } from "@/lib/tarification";
import { Ballon, Batiment, Bouclier, Carte, Coche, Document, Enfant, Epingle, FlecheDroite, Gateau, Groupe, Horloge } from "@/components/icons";
import { GATEAU_NOTE } from "@/data/formules";
import type { FormuleVue } from "@/lib/vues";
import { RESUME_ANNULATION, DELAI_RESERVATION_HEURES } from "@/data/reglement";
import {
  TEAM_BUILDING_MIN_PARTICIPANTS,
  TEAM_BUILDING_MAX_PARTICIPANTS,
} from "@/data/bubble-team";

const MagicRings = dynamic(() => import("@/components/magic-rings"), { ssr: false });

const ActivitesStack = dynamic(() => import("@/components/activites-stack"), { ssr: false });

const marqueeItems = [
  "ANNIVERSAIRES", "BUBBLE FOOT", "TERRAIN PRIVÉ", "TEAM BUILDING",
  "FOUS RIRES", "FOOT INDOOR", "GOÛTER", "FUN",
];

/**
 * Page d'accueil.
 *
 * Les formules et leurs tarifs sont fournis par le composant serveur qui rend
 * cette page : ils viennent de la base, jamais d'une copie codée en dur.
 */
export function Accueil({ formules }: { formules: FormuleVue[] }) {
  const activites = useActivites(formules);

  /**
   * Le fond animé doit reprendre EXACTEMENT le jaune de la charte. On lit la
   * variable CSS `--color-field` plutôt que de recopier sa valeur : si la
   * couleur de marque change dans globals.css, l'animation suit toute seule.
   * La valeur littérale ne sert que de repli avant l'hydratation.
   */
  const [jauneCharte, setJauneCharte] = useState("#f4b23f");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-field")
      .trim();
    /*
      `set-state-in-effect` DÉSACTIVÉE ICI, EN CONNAISSANCE DE CAUSE.

      La règle vise les états qu'on pourrait calculer pendant le rendu. Celui-ci
      ne le peut pas : `getComputedStyle` lit le style RÉSOLU par le navigateur,
      qui n'existe pas côté serveur. C'est le cas que la règle autorise
      explicitement — se synchroniser avec un système extérieur à React, ici le
      moteur de style — mais qu'elle ne sait pas reconnaître.

      L'effet ne s'exécute qu'une fois, et la valeur littérale sert de repli
      avant l'hydratation : un seul rendu supplémentaire, sur une valeur qui ne
      changera plus.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v) setJauneCharte(v);
  }, []);

  return (
    <>
      {/* ══════ HERO ══════ */}
      {/*
        PLANCHER À 80vh, ET NON 88vh.

        Ce plancher ne sert que sur les écrans HAUTS : partout ailleurs, le
        contenu est plus grand que lui et c'est le contenu qui décide. À 88vh,
        sur une tablette de 1024 px de haut, il réclamait 901 px pour un contenu
        qui en occupe 817 — le bloc se centrait, et il restait 140 px de vide
        entre la dernière carte d'activité et l'indicateur « Scroll », lequel
        est ancré au bas de la SECTION et non au bas du contenu. Sur un écran de
        1080 px, même trou : 121 px.

        À 80vh, l'écart retombe entre 40 et 58 px sur tous les formats mesurés —
        375, 390, 768, 1280, 1440 et 1920. C'est ça, « bien positionné » : le
        même équilibre partout, pas un hero qui se distend dès qu'on lui donne
        de la place. Le hero occupe toujours 80 à 82 % de la hauteur visible,
        donc il reste dominant.
      */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
        {/* MagicRings background */}
        <div className="absolute inset-0 z-0">
          <MagicRings
            color={jauneCharte}
            colorTwo={jauneCharte}
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
        <div className="absolute inset-0 z-[1] bg-radial-[ellipse_at_center] from-black/65 via-black/35 to-transparent" />

        {/*
          LE REMBOURRAGE DU BAS RÉSERVE LA PLACE DE L'INDICATEUR « SCROLL ».

          Celui-ci est en position ABSOLUE, à 32 px du bas du hero : il ne pousse
          rien, il se superpose. C'est donc au contenu de lui laisser la place,
          sinon il vient s'écraser sur le dernier élément — ce qui est arrivé
          deux fois.

          Mesuré après le retrait de la rangée de chiffres : avec `pb-24`, il ne
          restait plus que 8 px entre la dernière carte d'activité et
          l'indicateur sur un écran de 375 px, et 23 px sur un 1280. Les deux se
          lisaient comme une collision. `pb-32` (128 px) — l'indicateur en
          occupe 88 à lui seul, 32 de décalage plus 56 de hauteur — ramène
          l'écart à 40 px sur téléphone et 56 sur ordinateur.

          Sur les écrans hauts, le hero atteint son plancher de 88vh avant que le
          contenu ne le remplisse : celui-ci se centre alors, et l'écart grandit
          de lui-même. C'est le bon sens de variation — on serre quand la place
          manque, jamais l'inverse.
        */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 lg:px-8 pt-28 pb-32 md:pt-32 md:pb-36 w-full text-center">
          {/* Headline central */}
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-tight leading-[1.05] text-foreground">
            <FadeIn delay={0.1} className="block md:whitespace-nowrap">
              <span>Les enfants </span>
              <span className="text-gradient-field">s&apos;éclatent</span>
              <span>,</span>
            </FadeIn>
            <FadeIn delay={0.3} className="block md:whitespace-nowrap">
              <span>les parents </span>
              <span className="text-gradient-field">soufflent.</span>
            </FadeIn>
          </h1>

          <FadeIn delay={0.9}>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground text-balance px-4">
              L&apos;anniversaire 100&nbsp;%&nbsp;foot, <span className="text-foreground font-semibold">organisé de A à Z.</span>
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1.1}>
            {/*
              `min-h-14` et non `h-14`, `px-6` et non `px-8` sur téléphone.

              Une hauteur fixe interdit au libellé de se replier : il déborde à
              la place. Mesuré avec la police doublée — le réglage « taille du
              texte » d'Android, et le critère 1.4.4 du WCAG —, il manquait
              28 px à « Réserver maintenant », qui est le bouton principal du
              site. Le rembourrage horizontal en rendait 32 à lui seul.
            */}
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 px-2">
              <Link
                href="/reservation"
                className="btn-glass-field inline-flex min-h-14 items-center justify-center gap-2 text-center text-[#0a0a0b] text-lg px-6 py-3 sm:px-8 rounded-2xl"
              >
                {/* Enveloppé : un nœud de texte nu devient un élément flex
                    anonyme dont la largeur minimale ne cède pas. */}
                <span className="min-w-0">Réserver maintenant</span>
              </Link>
              <Link
                href="#activites"
                className="btn-outline-light inline-flex min-h-14 items-center justify-center gap-2 text-center text-lg px-6 py-3 sm:px-8 rounded-2xl"
              >
                Découvrir
              </Link>
            </div>
          </FadeIn>

          {/*
            LA RANGÉE DE CHIFFRES A ÉTÉ RETIRÉE — le 13 septembre 2026, sur
            décision de Mathis.

            Elle en annonçait trois. « 2000+ fêtes organisées » était inventé et
            a sauté le premier : une allégation chiffrée invérifiable est une
            pratique commerciale trompeuse (art. VI.97 du Code de droit
            économique). Restaient « 2 terrains indoor » et « 2 formules
            anniversaire » — vrais tous les deux, mais deux fois le chiffre 2
            côte à côte ne prouvent pas grand-chose, et ils coûtaient une
            centaine de pixels au moment précis où le hero doit convaincre.

            La preuve, désormais, ce sont les quatre cartes d'activités
            juste au-dessus : elles disent ce qu'on peut faire ET y mènent.
          */}
          {/*
            LES TROIS ACTIVITÉS, À LA PLACE DE LA PHOTO DU COMPLEXE.

            Demandé par l'exploitant. Le cadre qui occupait cette place montrait
            une vue des terrains ; il envoyait un message d'ambiance, mais ne
            menait nulle part. Les trois activités, elles, sont des liens
            profonds : un clic ouvre le tunnel de réservation directement sur
            l'activité choisie, sans repasser par l'écran de sélection.

            Elles sont décrites par `useActivites()`, le même module que la page
            Réserver, pour que les deux ne puissent pas raconter deux choses
            différentes — ce qui était déjà arrivé entre la page Réserver et la
            section « activités » plus bas.

            L'emplacement photo `terrain-vide-2` n'est plus utilisé nulle part.
            Il reste déclaré dans `lib/photos.ts` : le supprimer obligerait à
            tout rebrancher le jour où on veut remontrer le complexe.
          */}
          <FadeIn delay={1.5}>
            <ActivitesHero activites={activites} />
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
      <WaveDivider fill="#121214" className="-mt-1 relative z-10" />

      {/* ══════ MARQUEE ══════ */}
      <section className="py-5 overflow-hidden bg-[#121214]">
        <Marquee speed={25} className="text-foreground/70 font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold">
          <div className="flex items-center gap-8 px-4">
            {marqueeItems.map((item, i) => (
              <span key={i} className="flex items-center gap-4 whitespace-nowrap">
                {item}
                <Ballon className="size-4 text-kick/50" />
              </span>
            ))}
          </div>
        </Marquee>
      </section>

      {/* ── Vague de sortie marquee → activités ── */}
      <WaveDivider fill="#121214" flip />

      {/* ══════ ACTIVITÉS — section épinglée pendant l'empilement ══════ */}
      <section id="activites">
        <ActivitesStack>
          <FadeInView>
            <div className="text-center max-w-2xl mx-auto px-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field mb-4">
                <Ballon className="size-4" /> Nos activités
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold">
                Trois univers, <span className="text-gradient-field">un seul complexe</span>
              </h2>
            </div>
          </FadeInView>
        </ActivitesStack>
      </section>

      {/* ── Vague de transition → formules ── */}
      <WaveDivider fill="#121214" />

      {/* ══════ FORMULES ANNIVERSAIRE ══════ */}
      <section id="formules" className="bg-[#121214] grain relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 top-10 w-80 h-80 rounded-full border-2 border-dashed border-field/12" />
          <div className="absolute left-8 bottom-10 w-40 h-40 dot-grid fade-mask-radial" />
          <div className="absolute -left-24 top-1/3 w-72 h-72 rounded-full bg-kick/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 lg:px-8 py-12 md:py-16">
          <FadeInView>
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full bg-kick/10 px-4 py-1.5 text-sm font-semibold text-kick mb-4">
                <Gateau className="size-4" /> Les anniversaires Offside
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold leading-tight">
                {formules.length} formules, {formules.length} façons de <span className="text-gradient-field">fêter son anniversaire</span>
              </h2>
            </div>
          </FadeInView>

          <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-2" staggerDelay={0.12}>
            {formules.map((f) => (
              <StaggerItem key={f.id} className="h-full">
                <Tilt3D intensity={6} className="h-full">
                  <div className="h-full flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 hover:border-field/40 transition-colors duration-500">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold">{f.nom}</h3>
                      {/*
                        Espace insécable avant le « € » : c'est la typographie
                        française, et c'est surtout ce qu'affichent déjà le hero
                        (« Dès 180 € ») et tout le tunnel de réservation, qui
                        passent par `montantLisible()`. Ici le prix était collé
                        au signe — deux écritures du même montant sur la même
                        page.
                      */}
                      <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-field whitespace-nowrap">
                        {euros(f.prixBase)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-kick">{f.accroche}</p>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{f.description}</p>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Jusqu&apos;à <strong className="text-foreground">{f.enfantsInclus} enfants</strong>
                      {" · "}+{euros(f.prixEnfantSup)} par enfant supplémentaire
                    </p>

                    <ul className="mt-5 space-y-2 flex-1">
                      {f.inclus.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Coche className="size-4 text-field mt-0.5 shrink-0" />
                          {inc}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Gateau className="size-3.5 mt-0.5 shrink-0 text-kick" /> {GATEAU_NOTE}
                    </p>

                    {/*
                      Sur téléphone, le bouton portait « Réserver la formule
                      Kick-Off » sur deux lignes alignées à gauche, la flèche
                      restant seule au milieu de la hauteur, très à droite : le
                      libellé et son signe ne se lisaient plus ensemble. Il
                      occupe désormais toute la largeur de la carte, centré, et
                      sa hauteur s'adapte au repli du texte (`min-h` et non `h`,
                      sinon la deuxième ligne déborde du fond).
                    */}
                    <MagneticButton className="mt-6 block sm:inline-block">
                      <Link
                        href={hrefActivite("anniversaire")}
                        className="btn-glass-field flex w-full items-center justify-center gap-2 text-center text-[#0a0a0b] px-5 py-3 min-h-12 rounded-2xl font-semibold text-sm sm:w-auto sm:px-6 sm:text-base"
                      >
                        Réserver la formule {f.nom} <FlecheDroite className="size-4 shrink-0" />
                      </Link>
                    </MagneticButton>
                  </div>
                </Tilt3D>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/*
            Une seule mention pour toute la grille, plutôt que « TVAC » collé à
            chaque prix : l'article VI.2 du Code de droit économique demande que
            le consommateur voie le prix qu'il paiera réellement, pas que le
            sigle soit répété quatre fois. Le tunnel de réservation le redit à
            l'endroit qui compte, juste avant le bouton de paiement.
          */}
          <p className="mt-6 text-sm text-muted-foreground">
            Tous les prix sont indiqués TVAC, pour un anniversaire organisé sur place.
          </p>

          <FadeInView delay={0.2}>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <Horloge className="size-5 text-field shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Même à la dernière minute :</strong> réservez
                  jusqu&apos;à {DELAI_RESERVATION_HEURES} heure avant le début.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <Bouclier className="size-5 text-field shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Annulation :</strong> {RESUME_ANNULATION}
                </p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ── Vague de transition → team building ── */}
      <WaveDivider fill="#121214" />

      {/* ══════ TEAM BUILDING ══════ */}
      <section className="bg-[#121214] grain relative overflow-hidden">
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
              <span className="inline-flex items-center gap-2 rounded-full bg-field/10 px-4 py-1.5 text-sm font-semibold text-field mb-4">
                <Batiment className="size-4" /> Entreprises
              </span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold leading-tight">
                Vous êtes une <span className="text-gradient-field">entreprise&nbsp;?</span>
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
                Venez vivre un team building sportif qui soude vos équipes :
                tournoi de foot indoor, Bubble Foot entre collègues, terrain rien que pour vous.
                On organise tout de A à Z. Privatisation <strong>à la demi-journée</strong>, devis sur mesure.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  // Annonçait « 10 à 40 personnes » alors que le formulaire en
                  // accepte 6 à 60 : un groupe de 8 lisait qu'il était trop petit
                  // pour venir. On lit désormais les mêmes bornes que lui.
                  {
                    icon: Groupe,
                    label: `${TEAM_BUILDING_MIN_PARTICIPANTS} à ${TEAM_BUILDING_MAX_PARTICIPANTS} personnes`,
                  },
                  { icon: Horloge, label: "À la demi-journée" },
                  { icon: Batiment, label: "Terrain privatisé" },
                  { icon: Document, label: "Devis sur mesure" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-field/10 text-field shrink-0">
                      <item.icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <MagneticButton className="inline-block mt-8">
                <Link
                  href={hrefActivite("groupes")}
                  className="btn-glass-field inline-flex items-center gap-2 text-[#0a0a0b] px-7 h-13 rounded-2xl text-base"
                >
                  Organiser mon événement <FlecheDroite className="size-5" />
                </Link>
              </MagneticButton>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="relative">
                <Tilt3D intensity={8}>
                  <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-field/20 via-[#121214] to-kick/10 overflow-hidden border border-field/10 shadow-xl shadow-field/5">
                    <Photo src="/images/offside-foot-indoor.jpg" alt="Team building sportif à Offside Foot Indoor — foot indoor entre collègues" sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
                  </div>
                </Tilt3D>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ── Vague de transition → réassurance ── */}
      <WaveDivider fill="#121214" flip />

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
            Pourquoi <span className="text-gradient-field">Offside Foot Indoor</span> ?
          </h2>
        </FadeInView>
        <StaggerContainer className="grid grid-cols-2 gap-5 md:grid-cols-4" staggerDelay={0.1}>
          {[
            { icon: Batiment, title: "Toute l’année", subtitle: "En salle, quelle que soit la météo", color: "bg-white/[0.04] text-field border-white/10" },
            { icon: Epingle, title: "Facile d'accès", subtitle: "Parking gratuit", color: "bg-white/[0.04] text-field border-white/10" },
            /*
              DEUX AFFIRMATIONS FAUSSES CORRIGÉES ICI.

              « Dès 6 ans » : Brahim a répondu le 17 septembre 2026 « à partir
              de 4 ans ». Un parent d'enfant de 5 ans se croyait exclu, sur la
              page d'accueil, alors que le tunnel accepte sa réservation.

              « Encadrement adapté » : Brahim a écrit, à propos du délai de
              réservation, « même en dernière minute vu qu'il n'y a pas de
              coach ». Il n'y a donc pas d'encadrement général. Un animateur
              n'est compris que dans la formule Bubble, ce que les CGV disent
              déjà correctement (« l'animateur Bubble est compris dans les
              prestations pour lesquelles sa présence est prévue »).

              Promettre un encadrement est le pire endroit où se tromper : un
              parent peut laisser ses enfants en croyant qu'on les surveille.
              On annonce donc ce qui est vérifiable — le matériel.
            */
            { icon: Enfant, title: "Dès 4 ans", subtitle: "Terrain et matériel adaptés", color: "bg-white/[0.04] text-kick border-white/10" },
            { icon: Carte, title: "Réservation flexible", subtitle: `Jusqu’à ${DELAI_RESERVATION_HEURES}h avant`, color: "bg-white/[0.04] text-field border-white/10" },
          ].map((item) => (
            /*
              `h-full` sur les deux niveaux : sans lui, chaque carte se calait
              sur son propre texte. « Facile d'accès » tient sur une ligne,
              « Réservation flexible » sur deux — les quatre encadrés d'une même
              rangée finissaient à des hauteurs différentes, avec un décrochage
              de 90 px mesuré sur téléphone, où la grille est en 2 × 2.
            */
            <StaggerItem key={item.title} className="h-full">
              {/*
                Rembourrage et corps réduits sous `sm:`. En 2 × 2 sur un écran
                de 320 px, chaque encadré n'offrait que 86 px de texte utile
                entre ses marges intérieures de 24 px : « Réservation », un seul
                mot de 18 px en gras, en réclame 115 et débordait. On rend 16 px
                de rembourrage, on descend le titre à 16 px, et on autorise la
                césure — la page est en français (`lang="fr"`), le navigateur
                sait donc couper « Réser-vation » au bon endroit plutôt que de
                laisser le mot sortir de son cadre.
              */}
              <div className={`h-full text-center p-4 sm:p-6 rounded-2xl border ${item.color} group hover:shadow-lg transition-all duration-500`}>
                <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="size-6 sm:size-7" />
                </div>
                <p className="mt-3 sm:mt-4 text-base sm:text-lg font-bold font-[family-name:var(--font-heading)] hyphens-auto text-balance">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1 hyphens-auto text-balance">{item.subtitle}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        </div>
      </section>

      {/* ── Vague de transition → CTA ── */}
      <WaveDivider fill="#050506" />

      {/* ══════ CTA FINAL ══════ */}
      <section className="aurora-bg text-white relative overflow-hidden">
        <div className="field-pattern" />
        <div className="aurora-orb-3" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 lg:px-8 py-14 md:py-20 text-center">
          <FadeInView>
            <div className="glass mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-8">
              <Horloge className="size-8" />
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
                  className="btn-glass-kick inline-flex items-center gap-2.5 text-[#0a0a0b] text-lg px-10 h-14 rounded-2xl"
                >
                  C&apos;est parti !
                  <FlecheDroite className="size-5" />
                </Link>
              </PulseGlow>
            </MagneticButton>
          </FadeInView>
        </div>
      </section>
    </>
  );
}
