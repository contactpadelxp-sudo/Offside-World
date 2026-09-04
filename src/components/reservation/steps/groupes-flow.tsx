"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn, StaggerContainer, StaggerItem, Tilt3D } from "@/components/motion";
import { Photo } from "@/components/photo";
import { usePhoto } from "@/components/photos-provider";
import { PhoneField } from "@/components/reservation/phone-field";
import { isValidEmail } from "@/lib/validation";
import { memoriserRecap } from "@/lib/reservation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { demanderDevis, reserverBubble } from "@/app/reservation/actions";
import type { CreneauVue } from "@/lib/vues";
import type { DemiJourneeVue } from "@/lib/demi-journees";
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
import {
  AlerteCercle, Ballon, Batiment, Bouclier, Coche, Document, FlecheDroite, FlecheGauche, Groupe, Horloge, Info, Visuel,
} from "@/components/icons";

type Offre = "bubble" | "team-building";
type Step = "offre" | "creneau" | "recap";

export function GroupesFlow({
  onBack,
  creneaux,
  demiJournees,
}: {
  onBack: () => void;
  creneaux: CreneauVue[];
  demiJournees: DemiJourneeVue[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("offre");
  const [offre, setOffre] = useState<Offre | null>(null);

  const [bubbleCreneau, setBubbleCreneau] = useState<CreneauVue | null>(null);
  const [nbPersonnes, setNbPersonnes] = useState(BUBBLE_MIN_PERSONNES);
  const [demiJournee, setDemiJournee] = useState<DemiJourneeVue | null>(null);
  const [nbParticipants, setNbParticipants] = useState(TEAM_BUILDING_MIN_PARTICIPANTS);

  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
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

  const photoBubble = usePhoto("bubble-portrait");
  const photoEntree = usePhoto("entree-double-ballon");

  /** Les créneaux Bubble arrivent triés par date : on limite l'affichage. */
  const creneauxAffiches = useMemo(() => creneaux.slice(0, 12), [creneaux]);

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

    memoriserRecap({
      ref: resultat.reference,
      type: isBubble ? "bubble" : "team-building",
      total: resultat.total,
      formule: isBubble ? "Bubble Foot" : "Team Building — demi-journée",
      date: isBubble ? bubbleCreneau?.jourLabel : demiJournee?.jourLabel,
      horaire: isBubble
        ? `${bubbleCreneau?.debut} – ${bubbleCreneau?.fin}`
        : `${demiJournee?.periodeLabel} · ${demiJournee?.debut} – ${demiJournee?.fin}`,
      surDevis: !isBubble,
    });
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
      tag: `${BUBBLE_PRIX_PAR_PERSONNE}€/personne`,
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
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
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
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre créneau</h2>

          {creneauxAffiches.length === 0 ? (
            <p className="mt-4 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground">
              Aucun créneau Bubble Foot n&apos;est ouvert pour le moment. Contactez-nous : nous
              trouverons un horaire.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {creneauxAffiches.map((c) => (
                <button key={c.id} onClick={() => c.libre && setBubbleCreneau(c)} disabled={!c.libre} className="text-left">
                  <Card className={`border-2 transition-all duration-300 ${
                    !c.libre ? "opacity-50 cursor-not-allowed"
                    : bubbleCreneau?.id === c.id ? "border-field ring-2 ring-field/20"
                    : "hover:border-field/40 card-hover"
                  }`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold capitalize">{c.jourLabel}</p>
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
              <Label htmlFor="nbPersonnes">Nombre de personnes</Label>
              <Input
                id="nbPersonnes"
                type="number"
                min={BUBBLE_MIN_PERSONNES}
                max={Math.min(BUBBLE_MAX_PERSONNES, bubbleCreneau.capacite)}
                value={nbPersonnes}
                onChange={(e) =>
                  setNbPersonnes(
                    Math.min(
                      Math.min(BUBBLE_MAX_PERSONNES, bubbleCreneau.capacite),
                      Math.max(BUBBLE_MIN_PERSONNES, Number(e.target.value))
                    )
                  )
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                De {BUBBLE_MIN_PERSONNES} à {Math.min(BUBBLE_MAX_PERSONNES, bubbleCreneau.capacite)} personnes.
              </p>
              <p className="mt-3 text-2xl font-bold text-field">{total}€</p>
              <p className="text-xs text-muted-foreground">{nbPersonnes} × {BUBBLE_PRIX_PAR_PERSONNE}€</p>
            </div>
          )}

          {erreur && (
            <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
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
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre demi-journée</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le team building se réserve à la demi-journée. Indiquez votre préférence : nous revenons
            vers vous avec un devis et la confirmation de la disponibilité.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demiJournees.map((dj) => (
              <button key={dj.id} onClick={() => setDemiJournee(dj)} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  demiJournee?.id === dj.id ? "border-kick ring-2 ring-kick/20" : "hover:border-kick/40 card-hover"
                }`}>
                  <CardContent className="p-4">
                    <p className="font-bold capitalize">{dj.jourLabel}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Horloge className="size-3.5" /> {dj.periodeLabel} · {dj.debut} – {dj.fin}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-6 max-w-xs">
            <Label htmlFor="nbParticipants">Nombre de participants</Label>
            <Input
              id="nbParticipants"
              type="number"
              min={TEAM_BUILDING_MIN_PARTICIPANTS}
              max={TEAM_BUILDING_MAX_PARTICIPANTS}
              value={nbParticipants}
              onChange={(e) =>
                setNbParticipants(
                  Math.min(
                    TEAM_BUILDING_MAX_PARTICIPANTS,
                    Math.max(TEAM_BUILDING_MIN_PARTICIPANTS, Number(e.target.value))
                  )
                )
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              De {TEAM_BUILDING_MIN_PARTICIPANTS} à {TEAM_BUILDING_MAX_PARTICIPANTS} personnes.
            </p>
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

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("offre")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!demiJournee} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <FlecheDroite className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 3 — récapitulatif + coordonnées */}
      {step === "recap" && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
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
                <span className="font-semibold capitalize">
                  {isBubble ? bubbleCreneau?.jourLabel : demiJournee?.jourLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horaire</span>
                <span className="font-semibold">
                  {isBubble
                    ? `${bubbleCreneau?.debut} – ${bubbleCreneau?.fin}`
                    : `${demiJournee?.periodeLabel} · ${demiJournee?.debut} – ${demiJournee?.fin}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isBubble ? "Personnes" : "Participants"}</span>
                <span className="font-semibold">{isBubble ? nbPersonnes : nbParticipants}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">{isBubble ? "Total" : "Tarif"}</span>
                <span className={`font-bold ${isBubble ? "text-field" : "text-kick"}`}>
                  {isBubble ? `${total}€` : "Sur devis"}
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
              <a href="/confidentialite" className="underline">Politique de confidentialité</a>
            </p>
            {!isBubble && (
              <div>
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input id="entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} maxLength={120} />
              </div>
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
              {emailTouched && email && !emailValid && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
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
                  <Label htmlFor="cgv" className="text-sm">
                    J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="underline text-field">CGV</a> et la <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline text-field">Politique de confidentialité</a>. <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="nl" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="nl" className="text-sm text-muted-foreground">Recevoir les offres par email (facultatif).</Label>
                </div>
              </div>

              {erreur && (
                <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
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
                  <><Coche className="size-5" /> Confirmer ma réservation</>
                ) : (
                  <><Document className="size-5" /> Demander un devis</>
                )}
              </button>
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Bouclier className="size-3.5" />
                {isBubble
                  ? "Le paiement en ligne arrive bientôt : nous vous recontactons pour confirmer."
                  : "Nous vous répondons sous 48 heures ouvrables."}
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
