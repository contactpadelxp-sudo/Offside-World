"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChampNombre } from "@/components/reservation/champ-nombre";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn, StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Photo } from "@/components/photo";
import { usePhoto } from "@/components/photos-provider";
import { PhoneField } from "@/components/reservation/phone-field";
import { isValidEmail } from "@/lib/validation";
import { memoriserRecap } from "@/lib/reservation";
import { mesurer } from "@/lib/mesure";
import { EMAIL } from "@/data/entreprise";
import { useScrollTop } from "@/lib/use-scroll-top";
import { demanderDevis, reserverBubble } from "@/lib/actions/reservation";
import type { CreneauVue } from "@/lib/vues";
import type { DemiJourneeVue } from "@/lib/demi-journees";
import type { RefTitre } from "../reservation-flow";
import {
  BUBBLE_PRIX_PAR_PERSONNE,
  BUBBLE_MIN_PERSONNES,
  BUBBLE_MAX_PERSONNES,
  BUBBLE_DUREE_MINUTES,
  TEAM_BUILDING_INCLUS,
  TEAM_BUILDING_MAX_PARTICIPANTS,
  TEAM_BUILDING_MIN_PARTICIPANTS,
} from "@/data/bubble-team";
import { RESUME_ANNULATION } from "@/data/reglement";
import { euros } from "@/lib/tarification";
import {
  AlerteCercle, Ballon, Batiment, Bouclier, Coche, Document, FlecheDroite, FlecheGauche, Groupe, Horloge, Info, Visuel,
} from "@/components/icons";

/** « Matin », ou « Matin · 09:00 – 13:00 » quand les heures sont connues. */
function horaireDemiJournee(dj: DemiJourneeVue | null): string {
  if (!dj) return "";
  return dj.debut && dj.fin ? `${dj.periodeLabel} · ${dj.debut} – ${dj.fin}` : dj.periodeLabel;
}

type Offre = "bubble" | "team-building";
type Step = "offre" | "creneau" | "recap";

export function GroupesFlow({
  paiementActif,
  onBack,
  titreRef,
  creneaux,
  demiJournees,
}: {
  paiementActif: boolean;
  onBack: () => void;
  /** Titre de l'étape affichée, qui reçoit le focus — voir `reservation-flow`. */
  titreRef: RefTitre;
  creneaux: CreneauVue[];
  demiJournees: DemiJourneeVue[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("offre");
  const [offre, setOffre] = useState<Offre | null>(null);

  // Mêmes jalons que le parcours anniversaire, voir le commentaire là-bas.
  useEffect(() => {
    if (step === "creneau" && offre) mesurer("formule", offre);
    else if (step === "recap") mesurer("formulaire");
  }, [step, offre]);

  const [bubbleCreneau, setBubbleCreneau] = useState<CreneauVue | null>(null);
  const [nbPersonnes, setNbPersonnes] = useState(BUBBLE_MIN_PERSONNES);
  const [demiJournee, setDemiJournee] = useState<DemiJourneeVue | null>(null);
  const [nbParticipants, setNbParticipants] = useState(TEAM_BUILDING_MIN_PARTICIPANTS);

  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  /*
    COORDONNÉES DE FACTURATION, DEMANDÉES ICI PLUTÔT QU'AU TÉLÉPHONE.

    Elles ne l'étaient nulle part : l'exploitant devait rappeler chaque société
    pour obtenir son adresse et son numéro de TVA avant de pouvoir établir le
    devis. Un aller-retour sur chaque demande.

    Facultatives, et dites comme telles. Une adresse complète et un numéro de
    TVA exigés d'un prospect qui n'a pas encore vu un prix font abandonner des
    demandes — et une demande perdue coûte plus cher qu'un coup de fil. Les
    champs du back-office restent modifiables, ils ont donc le dernier mot.
  */
  const [adresse, setAdresse] = useState("");
  const [tvaClient, setTvaClient] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [message, setMessage] = useState("");
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const isBubble = offre === "bubble";
  /** Aperçu : le montant qui fera foi est recalculé par le serveur. */
  const total = isBubble ? BUBBLE_PRIX_PAR_PERSONNE * nbPersonnes : 0;

  // Chaque changement d'étape repart du haut de la page.
  useScrollTop(step);

  // …et le focus va au titre de la nouvelle étape, sinon il resterait sur un
  // bouton démonté et rien n'annoncerait le changement d'écran. Même
  // mécanique que sur le tunnel anniversaire, voir le commentaire là-bas.
  const premiereEtape = useRef(true);
  useEffect(() => {
    if (premiereEtape.current) {
      premiereEtape.current = false;
      return;
    }
    titreRef.current?.focus({ preventScroll: true });
  }, [step, titreRef]);

  const photoBubble = usePhoto("bubble-portrait");
  const photoEntree = usePhoto("entree-double-ballon");

  /** Les créneaux Bubble arrivent triés par date : on limite l'affichage. */
  const creneauxAffiches = useMemo(() => creneaux.slice(0, 12), [creneaux]);

  /**
   * Les demi-journées arrivent à plat, deux par date. Les afficher telles
   * quelles donnait vingt cartes pleine largeur qui répétaient chaque date
   * deux fois de suite, et repoussaient le bouton « Continuer » à six écrans
   * du haut. On les regroupe : une ligne par jour, deux pastilles à choisir.
   */
  const journees = useMemo(() => {
    const parJour = new Map<string, DemiJourneeVue[]>();
    for (const dj of demiJournees) {
      const liste = parJour.get(dj.jour);
      if (liste) liste.push(dj);
      else parJour.set(dj.jour, [dj]);
    }
    return [...parJour.entries()].map(([jour, liste]) => ({
      jour,
      jourLabel: liste[0].jourLabel,
      demiJournees: liste,
    }));
  }, [demiJournees]);

  /*
    CE QUI MANQUE, DIT EN TOUTES LETTRES. Même correctif que sur le tunnel
    anniversaire : le bouton final dépend de plusieurs conditions et,
    désactivé, il ne disait pas laquelle. La case des CGV est le cas le plus
    fréquent, et la moins visible.
  */
  const manquants = [
    !nom && "votre nom",
    !isBubble && !entreprise && "le nom de votre entreprise",
    !emailValid && "une adresse e-mail valide",
    !phoneValid && "un numéro de téléphone valide",
    !acceptCGV && "l'acceptation des conditions générales",
  ].filter(Boolean) as string[];

  async function envoyer() {
    setEnvoi(true);
    setErreur(null);

    const resultat = isBubble
      ? await reserverBubble({
          creneauId: bubbleCreneau?.id ?? "",
          nbPersonnes,
          clientNom: nom,
          clientEmail: email,
          clientTelephone: phone,
          remarques: message || undefined,
          newsletter: acceptNewsletter,
          cgv: acceptCGV,
        })
      : await demanderDevis({
          entreprise,
          contactNom: nom,
          contactEmail: email,
          contactTelephone: phone,
          dateSouhaitee: demiJournee?.jour ?? "",
          periode: demiJournee?.periode ?? "matin",
          nbParticipants,
          clientAdresse: adresse || undefined,
          clientTva: tvaClient || undefined,
          message: message || undefined,
          newsletter: acceptNewsletter,
          cgv: acceptCGV,
        });

    if (!resultat.ok) {
      setEnvoi(false);
      setErreur(resultat.message);
      if (resultat.champ === "creneau") {
        setBubbleCreneau(null);
        setStep("creneau");
      }
      return;
    }

    mesurer(offre === "bubble" ? "reservation" : "devis", offre ?? undefined);
    memoriserRecap({
      ref: resultat.reference,
      type: isBubble ? "bubble" : "team-building",
      total: resultat.total,
      formule: isBubble ? "Bubble Foot" : "Team Building — demi-journée",
      date: isBubble ? bubbleCreneau?.jourLabel : demiJournee?.jourLabel,
      horaire: isBubble
        ? `${bubbleCreneau?.debut} – ${bubbleCreneau?.fin}`
        : horaireDemiJournee(demiJournee),
      surDevis: !isBubble,
    });
    /*
      Vers Stripe si le paiement est configuré, vers la confirmation sinon.

      `window.location` et non le routeur de Next : Stripe est un autre site,
      et une navigation côté client ne sait pas y aller. `replace` plutôt que
      `assign` pour que le bouton « retour » du navigateur ne ramène pas sur
      un formulaire déjà envoyé — le client croirait devoir le renvoyer.
    */
    if (resultat.urlPaiement) {
      window.location.replace(resultat.urlPaiement);
      return;
    }
    router.push(`/confirmation?ref=${resultat.reference}`);
  }

  const offres = [
    {
      id: "bubble" as Offre,
      icon: Ballon,
      title: "Bubble Foot",
      description: "Le foot dans des bulles géantes : fous rires garantis.",
      img: photoBubble,
      // Les bulles sont à ~54 % de la hauteur de la photo.
      imgPosition: "object-[center_54%]",
      // Même libellé que sur la page de choix d'activité. Le montant passe par
      // `euros()`, comme partout ailleurs : une seule fonction écrit les prix du
      // site, et c'est elle qui garantit la virgule et l'espace insécable.
      tag: `Dès ${euros(BUBBLE_PRIX_PAR_PERSONNE)}/pers.`,
      detail: `${BUBBLE_DUREE_MINUTES} minutes • à partir de ${BUBBLE_MIN_PERSONNES} personnes`,
      accentText: "text-field",
      accentBadge: "bg-field/15 text-field",
      iconBg: "bg-field/15 text-field",
      border: "border-field/20 hover:border-field/60",
      glow: "bg-field/25",
    },
    {
      id: "team-building" as Offre,
      icon: Batiment,
      title: "Team Building",
      description: "Privatisation du complexe pour votre équipe, à la demi-journée.",
      img: photoEntree,
      // Cadre paysage sur une photo portrait : on remonte pour garder
      // l'enseigne entière au-dessus des ballons.
      imgPosition: "object-[center_20%]",
      tag: "Sur devis",
      detail: "Demi-journée • organisation sur mesure",
      accentText: "text-kick",
      accentBadge: "bg-kick/15 text-kick",
      iconBg: "bg-kick/15 text-kick",
      border: "border-kick/20 hover:border-kick/60",
      glow: "bg-kick/25",
    },
  ];

  return (
    <div>
      {/*
        Ce titre reste affiché d'un bout à l'autre : il ne prend la référence
        qu'à l'étape du choix de l'offre, où il est le seul titre. Aux étapes
        suivantes, c'est le titre de l'étape qui reçoit le focus — deux
        éléments ne peuvent pas porter la même référence en même temps.
      */}
      <h1 ref={step === "offre" ? titreRef : null} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Groupe className="size-7 text-field" /> Bubble Foot &amp; Team Building
      </h1>
      <p className="mt-1 text-muted-foreground">Entre amis, entre collègues ou en équipe.</p>

      {/* ÉTAPE 1 — choix de l'offre */}
      {step === "offre" && (
        <FadeIn className="mt-6">
          <StaggerContainer className="grid gap-6 sm:grid-cols-2" staggerDelay={0.1}>
            {offres.map((o) => (
              <StaggerItem key={o.id} className="h-full">
                <Tilt3D intensity={8} className="h-full">
                  <button
                    onClick={() => { setOffre(o.id); setStep("creneau"); }}
                    className="w-full text-left h-full group"
                  >
                    <Card className={`h-full overflow-hidden border-2 py-0 gap-0 transition-all duration-500 cursor-pointer ${o.border} bg-card flex flex-col`}>
                      {/* Emplacement photo — fondu dans le corps de la carte */}
                      {/* Cadre portrait sur mobile, plus ramassé dès deux colonnes
                          pour que les deux cartes tiennent dans l'écran sans défiler. */}
                      <div className="relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden">
                        {o.img ? (
                          <Photo
                            src={o.img}
                            alt={o.title}
                            sizes="(max-width: 640px) 100vw, 420px"
                            className={`object-cover ${o.imgPosition} transition-transform duration-700 group-hover:scale-105`}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/[0.035] to-transparent" />
                            <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                            <div aria-hidden className={`absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 size-44 rounded-full blur-3xl ${o.glow}`} />
                            <o.icon className="relative size-12 text-foreground/25" />
                            <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                              <Visuel className="size-3.5" /> Photo à venir
                            </span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-card" />
                        <div className={`absolute left-4 top-4 inline-flex items-center rounded-full bg-black/65 px-3 py-1 text-xs font-semibold ring-1 ring-white/15 backdrop-blur-md ${o.accentText}`}>
                          {o.tag}
                        </div>
                      </div>

                      {/* Contenu — remonte légèrement pour chevaucher le fondu */}
                      <div className="-mt-6 p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2.5">
                          <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${o.iconBg} group-hover:scale-110 transition-transform duration-500`}>
                            <o.icon className="size-5" />
                          </div>
                          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] leading-tight">{o.title}</h2>
                        </div>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{o.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground flex-1">{o.detail}</p>
                        <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${o.accentText} group-hover:gap-2.5 transition-all duration-300`}>
                          Choisir <FlecheDroite className="size-4" />
                        </span>
                      </div>
                    </Card>
                  </button>
                </Tilt3D>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <div className="mt-8">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 2 — créneau Bubble Foot */}
      {step === "creneau" && isBubble && (
        <FadeIn className="mt-6">
          <h2 ref={titreRef} tabIndex={-1} className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre créneau</h2>

          {creneauxAffiches.length === 0 ? (
            <p className="mt-4 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground">
              {/*
                UN « CONTACTEZ-NOUS » QUI NE DONNE AUCUN MOYEN DE LE FAIRE EST
                UNE IMPASSE.

                Le message invitait à nous contacter sans adresse ni lien : le
                visiteur devait retourner chercher l'e-mail ailleurs sur le
                site, ou renoncer. Et ce n'est pas un cas de bord — le
                17 septembre 2026, le Bubble Foot n'a aucun créneau en base
                faute d'horaires confirmés, donc c'est LA SEULE CHOSE que voit
                quiconque clique sur l'activité.

                L'e-mail vient de `src/data/entreprise.ts`, comme partout
                ailleurs : le jour où il change, il change ici aussi.
              */}
              Aucun créneau Bubble Foot n&apos;est ouvert pour le moment. Écrivez-nous à{" "}
              <a href={`mailto:${EMAIL}`} className="font-medium text-field underline underline-offset-2">
                {EMAIL}
              </a>{" "}
              : nous trouverons un horaire.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/*
                `aria-pressed` : le créneau retenu n'était marqué que par une
                bordure verte. Les demi-journées du team building l'exposaient
                déjà, pas ces cartes-ci — on ne savait pas qu'un clic avait
                enregistré un choix, ni lequel.
              */}
              {creneauxAffiches.map((c) => (
                <button key={c.id} onClick={() => c.libre && setBubbleCreneau(c)} disabled={!c.libre} aria-pressed={bubbleCreneau?.id === c.id} className="text-left">
                  <Card className={`border-2 transition-all duration-300 ${
                    !c.libre ? "opacity-50 cursor-not-allowed"
                    : bubbleCreneau?.id === c.id ? "border-field ring-2 ring-field/20"
                    : "hover:border-field/40 card-hover"
                  }`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{c.jourLabel}</p>
                        <p className="text-sm text-muted-foreground">{c.debut} – {c.fin}</p>
                      </div>
                      <Badge variant={c.libre ? "secondary" : "destructive"}>
                        {c.libre ? "Disponible" : "Complet"}
                      </Badge>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}

          {bubbleCreneau && (
            <div className="mt-6 max-w-xs">
              <ChampNombre
                id="nbPersonnes"
                label="Nombre de personnes"
                min={BUBBLE_MIN_PERSONNES}
                max={Math.min(BUBBLE_MAX_PERSONNES, bubbleCreneau.capacite)}
                valeur={nbPersonnes}
                onChange={setNbPersonnes}
              />
            </div>
          )}

          {/*
            `role="alert"` : un créneau pris entre-temps renvoie ici depuis le
            récapitulatif. L'écran change tout seul et le message explique
            pourquoi ; sans annonce, il ne restait que l'écran changé.
          */}
          {erreur && (
            <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
              <AlerteCercle className="size-4 shrink-0 mt-0.5" /> {erreur}
            </p>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("offre")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!bubbleCreneau} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <FlecheDroite className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 2 — demi-journée team building */}
      {step === "creneau" && !isBubble && (
        <FadeIn className="mt-6">
          <h2 ref={titreRef} tabIndex={-1} className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre demi-journée</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le team building se réserve à la demi-journée. Indiquez votre préférence : nous revenons
            vers vous avec un devis et la confirmation de la disponibilité.
          </p>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {journees.map((j) => (
              <li key={j.jour} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="w-full font-medium sm:w-48">{j.jourLabel}</span>
                <div className="flex flex-wrap gap-2">
                  {j.demiJournees.map((dj) => {
                    const choisi = demiJournee?.id === dj.id;
                    return (
                      <button
                        key={dj.id}
                        type="button"
                        onClick={() => setDemiJournee(dj)}
                        aria-pressed={choisi}
                        className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                          choisi
                            ? "border-kick bg-kick/10 text-kick"
                            : "border-muted text-muted-foreground hover:border-kick/40 hover:text-foreground"
                        }`}
                      >
                        <Horloge className="size-3.5" />
                        {/*
                          L'heure ne s'écrit que si elle est connue. Voir
                          `bubble-team.ts` : elle vaut `null` tant que Brahim
                          n'a pas donné les plages réelles, et « Matin » seul
                          est vrai là où « Matin · 09:00 – 13:00 » ne l'était
                          pas.
                        */}
                        {dj.periodeLabel}
                        {dj.debut && dj.fin && ` · ${dj.debut} – ${dj.fin}`}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 max-w-xs">
            <ChampNombre
              id="nbParticipants"
              label="Nombre de participants"
              min={TEAM_BUILDING_MIN_PARTICIPANTS}
              max={TEAM_BUILDING_MAX_PARTICIPANTS}
              valeur={nbParticipants}
              onChange={setNbParticipants}
            />
          </div>

          <div className="mt-6 rounded-xl border border-kick/20 bg-kick/5 p-4">
            <h3 className="font-semibold text-sm">Compris dans la privatisation</h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {TEAM_BUILDING_INCLUS.map((inc) => (
                <li key={inc} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <Coche className="size-4 text-kick mt-0.5 shrink-0" />{inc}
                </li>
              ))}
            </ul>
          </div>

          {/*
            LE CHAMP QUI BLOQUE EST EN HAUT, LE BOUTON EN BAS, ET IL Y A UN
            AUTRE CHAMP ENTRE LES DEUX.

            On renseigne le nombre de participants — le seul champ visible près
            du bouton —, on descend, et « Continuer » est mort parce qu'aucune
            demi-journée n'a été cochée trois écrans plus haut. Rien ne le
            disait. Sur le tunnel anniversaire et sur l'envoi d'un devis au
            back-office, la même correction était déjà faite.
          */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("offre")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <div className="flex flex-col items-end">
              <Button onClick={() => setStep("recap")} disabled={!demiJournee} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
                Continuer <FlecheDroite className="size-4" />
              </Button>
              {/*
                LA RÉGION VIVANTE DOIT ÊTRE LÀ AVANT LE MESSAGE.

                Elle était montée AVEC son texte puis démontée d'un bloc. Or un
                lecteur d'écran n'annonce que ce qui CHANGE dans une région déjà
                présente : une région insérée avec son contenu est ignorée, et
                sa disparition ne l'est pas davantage. Le rappel restait donc
                purement visuel — exactement ce que la région prétendait
                corriger.

                Le paragraphe est désormais toujours rendu ; seul son contenu
                varie. Vide, un conteneur flex ne fait aucune hauteur — et
                surtout pas `hidden`, qui retire l'élément de l'arbre
                d'accessibilité et ramènerait le défaut. L'interligne est porté
                par le paragraphe quand il a du texte, pas par le parent, qui
                l'aurait appliqué même à vide.

                `polite` et non `alert` : c'est une consigne, pas une erreur —
                une alerte interromprait la lecture de l'étape.
              */}
              <p
                aria-live="polite"
                aria-atomic="true"
                className={`flex items-start gap-1.5 text-right text-sm text-muted-foreground ${
                  demiJournee ? "" : "mt-1.5"
                }`}
              >
                {!demiJournee && (
                  <>
                    <AlerteCercle className="mt-0.5 size-4 shrink-0 text-kick" />
                    <span>Choisissez d&apos;abord une demi-journée ci-dessus.</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 3 — récapitulatif + coordonnées */}
      {step === "recap" && (
        <FadeIn className="mt-6">
          <h2 ref={titreRef} tabIndex={-1} className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            {isBubble ? <Coche className="size-5 text-field" /> : <Document className="size-5 text-kick" />}
            {isBubble ? "Récapitulatif & coordonnées" : "Votre demande de devis"}
          </h2>

          <Card className="mt-4 border-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activité</span>
                <span className="font-semibold">{isBubble ? "Bubble Foot" : "Team Building"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-semibold">
                  {isBubble ? bubbleCreneau?.jourLabel : demiJournee?.jourLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horaire</span>
                <span className="font-semibold">
                  {isBubble
                    ? `${bubbleCreneau?.debut} – ${bubbleCreneau?.fin}`
                    : horaireDemiJournee(demiJournee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isBubble ? "Personnes" : "Participants"}</span>
                <span className="font-semibold">{isBubble ? nbPersonnes : nbParticipants}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">{isBubble ? "Total TVAC" : "Tarif"}</span>
                <span className={`font-bold ${isBubble ? "text-field" : "text-kick"}`}>
                  {isBubble ? euros(total) : "Sur devis"}
                </span>
              </div>
            </CardContent>
          </Card>

          {isBubble && (
            <div className="mt-4 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="size-4 text-field shrink-0 mt-0.5" />
              <p><strong className="text-foreground">Annulation :</strong> {RESUME_ANNULATION}</p>
            </div>
          )}

          <div className="mt-6 space-y-4 max-w-md">
            <h3 className="font-bold">Vos coordonnées</h3>
            <p className="text-xs text-muted-foreground">
              <a href="/confidentialite" className="underline py-1">Politique de confidentialité</a>
            </p>
            {!isBubble && (
              <div>
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input id="entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} maxLength={120} />
              </div>
            )}
            {!isBubble && (
              <>
                <div>
                  <Label htmlFor="adresse">Adresse de facturation (facultatif)</Label>
                  <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)}
                    maxLength={300} autoComplete="street-address"
                    placeholder="Rue, numéro, code postal, ville" />
                </div>
                <div>
                  <Label htmlFor="tvaClient">N° de TVA (facultatif)</Label>
                  <Input id="tvaClient" value={tvaClient} onChange={(e) => setTvaClient(e.target.value)}
                    maxLength={40} placeholder="BE 0123.456.789" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ces deux informations figureront sur votre devis. Sans elles, nous vous les
                    demanderons avant de l&apos;établir.
                  </p>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="nom">{isBubble ? "Nom" : "Nom du contact"}</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)} maxLength={254}
                className={emailTouched && email && !emailValid ? "border-destructive" : ""} />
              {/*
                `role="alert"` : le message n'apparaît qu'à la sortie du champ,
                quand le focus est déjà ailleurs. Il passait donc inaperçu, et
                le bouton d'envoi restait grisé sans raison apparente.
              */}
              {emailTouched && email && !emailValid && (
                <p role="alert" className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlerteCercle className="size-3.5" /> Adresse email invalide.
                </p>
              )}
            </div>
            <PhoneField onChange={(valeur, valide) => { setPhone(valeur); setPhoneValid(valide); }} />
            <div>
              <Label htmlFor="message">{isBubble ? "Remarques (facultatif)" : "Votre projet (facultatif)"}</Label>
              <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000}
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={isBubble ? "Une précision utile pour votre venue…" : "Horaires souhaités, restauration, contraintes…"} />
            </div>
          </div>

          <Card className="mt-6 border-2">
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="cgv" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="cgv" className="block text-sm leading-relaxed">
                    J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="underline text-field py-1">CGV</a> et la <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline text-field py-1">Politique de confidentialité</a>. <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="nl" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="nl" className="block text-sm leading-relaxed text-muted-foreground">Recevoir les offres par email (facultatif).</Label>
                </div>
              </div>

              {/* Un refus d'envoi muet donne l'impression que le bouton n'a rien fait. */}
              {erreur && (
                <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
                  <AlerteCercle className="size-4 shrink-0 mt-0.5" /> {erreur}
                </p>
              )}

              <button
                onClick={envoyer}
                disabled={envoi || !acceptCGV || !nom || !emailValid || !phoneValid || (!isBubble && !entreprise)}
                className="btn-glass-field w-full h-14 text-[#0a0a0b] text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {envoi ? (
                  "Envoi…"
                ) : isBubble ? (
                  <>
                    <Coche className="size-5" />
                    {paiementActif ? `Payer ${euros(total)}` : "Confirmer ma réservation"}
                  </>
                ) : (
                  <><Document className="size-5" /> Demander un devis</>
                )}
              </button>

              {/*
                Informatif et non urgent : « poli » laisse finir la phrase en
                cours au lieu de la couper à chaque frappe. `aria-atomic` fait
                relire la phrase entière, sinon seule la partie modifiée de la
                liste serait annoncée, hors contexte.
              */}
              {manquants.length > 0 && (
                <p aria-live="polite" aria-atomic="true" className="mt-3 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
                  <AlerteCercle className="mt-0.5 size-4 shrink-0 text-kick" />
                  <span>
                    Il manque {manquants.length > 1
                      ? `${manquants.slice(0, -1).join(", ")} et ${manquants[manquants.length - 1]}`
                      : manquants[0]}.
                  </span>
                </p>
              )}
              {/*
                Le team building part en DEVIS : aucun paiement, donc aucune de
                ces mentions. Seul le Bubble Foot est encaissé ici.
              */}
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <Bouclier className="size-3.5 shrink-0" />
                {!isBubble ? (
                  <span>Nous vous répondons sous 48 heures ouvrables.</span>
                ) : paiementActif ? (
                  <span>
                    Paiement sécurisé de <strong>{euros(total)} TVAC</strong> par Bancontact ou carte.
                    Activité à date déterminée : pas de droit de rétractation.
                  </span>
                ) : (
                  <span>Nous vous recontactons pour confirmer votre créneau.</span>
                )}
              </p>
            </CardContent>
          </Card>

          <div className="mt-4">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
