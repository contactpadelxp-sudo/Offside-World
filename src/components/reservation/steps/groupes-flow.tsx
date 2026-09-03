"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn } from "@/components/motion";
import { PhoneField } from "@/components/reservation/phone-field";
import { isValidEmail } from "@/lib/validation";
import { saveReservation } from "@/lib/reservation";
import {
  BUBBLE_PRIX_PAR_PERSONNE,
  BUBBLE_MIN_PERSONNES,
  BUBBLE_DUREE_MINUTES,
  bubbleSlots,
  bubbleTotal,
  demiJournees,
  TEAM_BUILDING_INCLUS,
  type BubbleSlot,
  type DemiJournee,
} from "@/data/bubble-team";
import { RESUME_ANNULATION } from "@/data/reglement";
import {
  ArrowLeft, ArrowRight, Lock, ShieldCheck, AlertCircle, Users, Check,
  Building2, CircleDot, Info, FileText, Clock,
} from "lucide-react";

type Offre = "bubble" | "team-building";
type Step = "offre" | "creneau" | "recap";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
}

export function GroupesFlow({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("offre");
  const [offre, setOffre] = useState<Offre | null>(null);

  const [bubbleSlot, setBubbleSlot] = useState<BubbleSlot | null>(null);
  const [nbPersonnes, setNbPersonnes] = useState(BUBBLE_MIN_PERSONNES);
  const [demiJournee, setDemiJournee] = useState<DemiJournee | null>(null);

  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [message, setMessage] = useState("");
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const emailValid = isValidEmail(email);
  const isBubble = offre === "bubble";
  const total = isBubble ? bubbleTotal(nbPersonnes) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Users className="size-7 text-field" /> Bubble Foot &amp; Team Building
      </h1>
      <p className="mt-1 text-muted-foreground">Entre amis, entre collègues ou en équipe.</p>

      {/* ÉTAPE 1 — choix de l'offre */}
      {step === "offre" && (
        <FadeIn className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <button onClick={() => { setOffre("bubble"); setStep("creneau"); }} className="text-left">
              <Card className="h-full border-2 hover:border-field transition-all duration-300 card-hover">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center rounded-xl bg-field/10 p-3 text-field">
                    <CircleDot className="size-6" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold">Bubble Foot</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Le foot dans des bulles géantes : fous rires garantis.
                  </p>
                  <p className="mt-3 text-3xl font-bold font-[family-name:var(--font-heading)] text-field">
                    {BUBBLE_PRIX_PAR_PERSONNE}€
                    <span className="text-sm font-normal text-muted-foreground">/personne</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {BUBBLE_DUREE_MINUTES} minutes • à partir de {BUBBLE_MIN_PERSONNES} personnes
                  </p>
                </CardContent>
              </Card>
            </button>

            <button onClick={() => { setOffre("team-building"); setStep("creneau"); }} className="text-left">
              <Card className="h-full border-2 hover:border-field transition-all duration-300 card-hover">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center rounded-xl bg-kick/10 p-3 text-kick">
                    <Building2 className="size-6" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold">Team Building</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Privatisation du complexe pour votre équipe, à la demi-journée.
                  </p>
                  <p className="mt-3 text-2xl font-bold font-[family-name:var(--font-heading)] text-kick">
                    Sur devis
                  </p>
                  <p className="text-xs text-muted-foreground">Demi-journée • organisation sur mesure</p>
                  <ul className="mt-3 space-y-1">
                    {TEAM_BUILDING_INCLUS.slice(0, 3).map((inc) => (
                      <li key={inc} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="size-3 text-kick mt-0.5 shrink-0" />{inc}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </button>
          </div>
          <div className="mt-8">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 2 — créneau */}
      {step === "creneau" && isBubble && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre créneau</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {bubbleSlots.map((slot) => (
              <button key={slot.id} onClick={() => slot.available && setBubbleSlot(slot)} disabled={!slot.available} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  !slot.available ? "opacity-50 cursor-not-allowed"
                  : bubbleSlot?.id === slot.id ? "border-field ring-2 ring-field/20"
                  : "hover:border-field/40 card-hover"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold capitalize">{formatDate(slot.date)}</p>
                      <p className="text-sm text-muted-foreground">{slot.start} – {slot.end}</p>
                    </div>
                    <Badge variant={slot.available ? "secondary" : "destructive"}>
                      {slot.available ? "Disponible" : "Complet"}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {bubbleSlot && (
            <div className="mt-6 max-w-xs">
              <Label htmlFor="nbPersonnes">Nombre de personnes</Label>
              <Input id="nbPersonnes" type="number" min={BUBBLE_MIN_PERSONNES} max={30} value={nbPersonnes}
                onChange={(e) => setNbPersonnes(Math.max(BUBBLE_MIN_PERSONNES, Number(e.target.value)))} />
              <p className="mt-1 text-xs text-muted-foreground">Minimum {BUBBLE_MIN_PERSONNES} personnes.</p>
              <p className="mt-3 text-2xl font-bold text-field">{total}€</p>
              <p className="text-xs text-muted-foreground">{nbPersonnes} × {BUBBLE_PRIX_PAR_PERSONNE}€</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("offre")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!bubbleSlot} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {step === "creneau" && !isBubble && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre demi-journée</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le team building se réserve à la demi-journée. Nous revenons vers vous avec un devis personnalisé.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demiJournees.map((dj) => (
              <button key={dj.id} onClick={() => dj.available && setDemiJournee(dj)} disabled={!dj.available} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  !dj.available ? "opacity-50 cursor-not-allowed"
                  : demiJournee?.id === dj.id ? "border-kick ring-2 ring-kick/20"
                  : "hover:border-kick/40 card-hover"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold capitalize">{formatDate(dj.date)}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5" /> {dj.periode} · {dj.start} – {dj.end}
                      </p>
                    </div>
                    <Badge variant={dj.available ? "secondary" : "destructive"}>
                      {dj.available ? "Disponible" : "Réservé"}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-kick/20 bg-kick/5 p-4">
            <h3 className="font-semibold text-sm">Compris dans la privatisation</h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {TEAM_BUILDING_INCLUS.map((inc) => (
                <li key={inc} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-kick mt-0.5 shrink-0" />{inc}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("offre")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!demiJournee} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* ÉTAPE 3 — récapitulatif + coordonnées */}
      {step === "recap" && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            {isBubble ? <Lock className="size-5 text-field" /> : <FileText className="size-5 text-kick" />}
            {isBubble ? "Récapitulatif & paiement" : "Votre demande de devis"}
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
                  {formatDate((isBubble ? bubbleSlot?.date : demiJournee?.date) ?? "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horaire</span>
                <span className="font-semibold">
                  {isBubble
                    ? `${bubbleSlot?.start} – ${bubbleSlot?.end}`
                    : `${demiJournee?.periode} · ${demiJournee?.start} – ${demiJournee?.end}`}
                </span>
              </div>
              {isBubble && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personnes</span>
                  <span className="font-semibold">{nbPersonnes}</span>
                </div>
              )}
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
                <Input id="entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="TechCorp SA" />
              </div>
            )}
            <div>
              <Label htmlFor="nom">{isBubble ? "Nom" : "Nom du contact"}</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)} placeholder={isBubble ? "jean@email.com" : "contact@entreprise.be"}
                className={emailTouched && email && !emailValid ? "border-destructive" : ""} />
              {emailTouched && email && !emailValid && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> Adresse email invalide.
                </p>
              )}
            </div>
            <PhoneField onChange={(_, valid) => setPhoneValid(valid)} />
            {!isBubble && (
              <div>
                <Label htmlFor="message">Votre projet (facultatif)</Label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Nombre de participants, horaires souhaités, restauration…" />
              </div>
            )}
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

              <button
                onClick={() => {
                  const ref = saveReservation({
                    type: isBubble ? "bubble" : "team-building",
                    total,
                    formule: isBubble ? "Bubble Foot" : "Team Building — demi-journée",
                  });
                  router.push(`/confirmation?ref=${ref}`);
                }}
                disabled={!acceptCGV || !nom || !emailValid || !phoneValid || (!isBubble && !entreprise)}
                className="btn-glass-field w-full h-14 text-[#0a0a0b] text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isBubble ? (<><Lock className="size-5" /> Payer ma réservation (démo)</>) : (<><FileText className="size-5" /> Demander un devis</>)}
              </button>
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5" />
                {isBubble
                  ? "Paiement par carte et Bancontact — bientôt disponible."
                  : "Nous vous répondons sous 48 heures ouvrables."}
              </p>
            </CardContent>
          </Card>

          <div className="mt-4">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
