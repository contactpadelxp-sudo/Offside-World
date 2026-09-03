"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn } from "@/components/motion";
import { Photo } from "@/components/photo";
import { PhoneField } from "@/components/reservation/phone-field";
import { isValidEmail } from "@/lib/validation";
import { saveReservation } from "@/lib/reservation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { formules, options, formulePrice, GATEAU_NOTE, type Formule, type Option } from "@/data/formules";
import { espaces, timeSlots, isSlotBooked } from "@/data/salles";
import { RESUME_ANNULATION, DELAI_RESERVATION_HEURES } from "@/data/reglement";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Lock,
  Calendar,
  Users,
  Sparkles,
  Cake,
  Info,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

type Step = "formule" | "details" | "creneau" | "paiement";

const STEPS: { key: Step; label: string }[] = [
  { key: "formule", label: "Formule" },
  { key: "details", label: "Détails" },
  { key: "creneau", label: "Créneau" },
  { key: "paiement", label: "Paiement" },
];

const DATES = ["2026-09-12", "2026-09-13", "2026-09-19"];

/* Image de chaque option (chemins exacts dans public/images/) */
const OPTION_IMAGES: Record<string, string> = {
  photo: "/images/photos.jpeg",
  pinata: "/images/pinata.webp",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AnniversaireFlow({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("formule");
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(null);
  const [childCount, setChildCount] = useState(10);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedEspace, setSelectedEspace] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const optionsTotal = options
    .filter((o) => selectedOptions.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0);
  const formuleTotal = selectedFormule ? formulePrice(selectedFormule, childCount) : 0;
  const totalPrice = formuleTotal + (selectedFormule ? optionsTotal : 0);
  const extraChildren = selectedFormule
    ? Math.max(0, childCount - selectedFormule.includedChildren)
    : 0;

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const emailValid = isValidEmail(parentEmail);

  // Chaque changement d'étape repart du haut de la page.
  useScrollTop(step);

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shrink-0 transition-all duration-500 ${
                  i < stepIndex
                    ? "bg-gradient-to-br from-field to-kick text-[#0a0a0b] shadow-lg shadow-field/20"
                    : i === stepIndex
                    ? "bg-gradient-to-br from-field to-kick text-[#0a0a0b] ring-4 ring-field/20 scale-110"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < stepIndex ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap hidden sm:block ${i === stepIndex ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-field to-kick rounded-full progress-bar" style={{ width: `${((stepIndex) / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* STEP 1: Formule */}
      {step === "formule" && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            2 formules, 2 façons de fêter son anniversaire
          </h2>
          <p className="mt-1 text-muted-foreground">Sélectionnez la formule idéale pour l&apos;anniversaire.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {formules.map((f) => (
              <button key={f.id} onClick={() => setSelectedFormule(f)} className="text-left">
                <Card
                  className={`h-full border-2 transition-all duration-300 card-hover ${
                    selectedFormule?.id === f.id
                      ? "border-field ring-2 ring-field/20"
                      : "hover:border-field/40"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="relative aspect-video rounded-xl bg-gradient-to-br from-field/20 to-kick/20 flex items-center justify-center mb-4 overflow-hidden">
                      <CircleDot className="size-10 text-field/60" />
                      <Photo src={f.image} alt={`Formule ${f.name}`} sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
                    </div>
                    <h3 className="text-lg font-bold">{f.name}</h3>
                    <p className="text-sm text-field font-medium">{f.tagline}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                    <p className="mt-3 text-3xl font-bold font-[family-name:var(--font-heading)] text-field">
                      {f.basePrice}€
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jusqu&apos;à {f.includedChildren} enfants • +{f.extraChildPrice}€ par enfant supplémentaire
                    </p>
                    <ul className="mt-3 space-y-1">
                      {f.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="size-3 text-field mt-0.5 shrink-0" />{inc}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Cake className="size-3.5 mt-0.5 shrink-0 text-kick" /> {GATEAU_NOTE}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("details")} disabled={!selectedFormule} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 2: Détails (enfant + options) */}
      {step === "details" && selectedFormule && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Users className="size-6 text-field" /> Détails de l&apos;anniversaire
          </h2>
          <p className="mt-1 text-muted-foreground">
            Quelques infos sur l&apos;enfant fêté, puis personnalisez avec nos extras.{" "}
            <a href="/confidentialite" className="underline">Politique de confidentialité</a>
          </p>

          {/* Infos enfant */}
          <div className="mt-6 max-w-md space-y-4">
            <div>
              <Label htmlFor="childName">Prénom de l&apos;enfant fêté</Label>
              <Input id="childName" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Ex. : Lucas" maxLength={50} />
            </div>
            <div>
              <Label htmlFor="childAge">Âge</Label>
              <Input id="childAge" type="number" min={4} max={17} value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="Ex. : 9" />
            </div>
            <div>
              <Label htmlFor="childCount">Nombre d&apos;enfants</Label>
              <Input id="childCount" type="number" min={1} max={selectedFormule.maxChildren} value={childCount} onChange={(e) => setChildCount(Math.min(selectedFormule.maxChildren, Math.max(1, Number(e.target.value))))} />
              <p className="mt-1 text-xs text-muted-foreground">
                Forfait jusqu&apos;à {selectedFormule.includedChildren} enfants — maximum {selectedFormule.maxChildren}.
              </p>
            </div>
          </div>

          {/* Détail du prix */}
          <Card className="mt-6 max-w-md border-2 border-field/30">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Formule {selectedFormule.name} (jusqu&apos;à {selectedFormule.includedChildren} enfants)
                </span>
                <span className="font-semibold whitespace-nowrap ml-3">{selectedFormule.basePrice}€</span>
              </div>
              {extraChildren > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {extraChildren} enfant{extraChildren > 1 ? "s" : ""} supplémentaire{extraChildren > 1 ? "s" : ""} × {selectedFormule.extraChildPrice}€
                  </span>
                  <span className="font-semibold whitespace-nowrap ml-3">+{extraChildren * selectedFormule.extraChildPrice}€</span>
                </div>
              )}
              {optionsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-semibold whitespace-nowrap ml-3">+{optionsTotal}€</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-field">{totalPrice}€</span>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <h3 className="mt-8 text-lg font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Sparkles className="size-5 text-kick" /> Options supplémentaires
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Facultatif — la décoration, les boissons et la vaisselle sont déjà comprises dans votre formule.
          </p>
          <div className="mt-4 space-y-3">
            {options.map((opt: Option) => (
              <button key={opt.id} onClick={() => toggleOption(opt.id)} className="w-full text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  selectedOptions.includes(opt.id) ? "border-field ring-2 ring-field/20" : "hover:border-field/40 card-hover"
                }`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-field/5">
                        {OPTION_IMAGES[opt.id] && <Photo src={OPTION_IMAGES[opt.id]} alt={opt.label} sizes="80px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        {opt.description && <p className="text-sm text-muted-foreground">{opt.description}</p>}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-field whitespace-nowrap ml-4">+{opt.price}€</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("formule")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("creneau")} disabled={!childName || !childAge} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 3: Créneau + espace */}
      {step === "creneau" && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Calendar className="size-6 text-field" /> Choisissez votre créneau
          </h2>
          <p className="mt-1 text-muted-foreground">
            Réservation possible jusqu&apos;à {DELAI_RESERVATION_HEURES} heure avant le début, même à la dernière minute.
          </p>

          <div className="mt-6">
            <Label>Date</Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {DATES.map((d) => (
                <button key={d} onClick={() => { setSelectedDate(d); setSelectedEspace(""); setSelectedSlot(""); }}
                  className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    selectedDate === d ? "border-field bg-field/10 text-field" : "border-muted hover:border-field/40"
                  }`}
                >
                  {formatDate(d)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {espaces.map((espace) => (
              <Card key={espace.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{espace.name}</h3>
                      <p className="text-sm text-muted-foreground">{espace.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Users className="size-3" /> Capacité : {espace.capacity} enfants</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {timeSlots.map((slot) => {
                      const booked = isSlotBooked(espace.id, selectedDate, slot.id);
                      const isSelected = selectedEspace === espace.id && selectedSlot === slot.id;
                      return (
                        <button key={slot.id} disabled={booked}
                          onClick={() => { setSelectedEspace(espace.id); setSelectedSlot(slot.id); }}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${
                            booked ? "border-destructive/30 bg-destructive/10 text-destructive/70 cursor-not-allowed line-through"
                            : isSelected ? "border-field bg-field text-[#0a0a0b] shadow-lg shadow-field/20"
                            : "border-muted hover:border-field/40"
                          }`}
                        >
                          {slot.start} – {slot.end}
                          {booked && <span className="ml-1 text-xs">(pris)</span>}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("details")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("paiement")} disabled={!selectedEspace || !selectedSlot} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 4: Récap + coordonnées + paiement */}
      {step === "paiement" && selectedFormule && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Lock className="size-6 text-field" /> Récapitulatif &amp; paiement
          </h2>

          {/* Récap */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-semibold">{selectedFormule.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Enfant fêté</span><span className="font-semibold">{childName} ({childAge} ans)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Nombre d&apos;enfants</span><span className="font-semibold">{childCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{formatDate(selectedDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Espace</span><span className="font-semibold">{espaces.find((s) => s.id === selectedEspace)?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horaire</span><span className="font-semibold">{timeSlots.find((s) => s.id === selectedSlot)?.start} – {timeSlots.find((s) => s.id === selectedSlot)?.end}</span></div>
              {selectedOptions.length > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Options</span><span className="font-semibold text-right">{options.filter((o) => selectedOptions.includes(o.id)).map((o) => o.label).join(", ")}</span></div>
              )}
              <div className="border-t pt-4 flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-field">{totalPrice}€</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Cake className="size-3.5 mt-0.5 shrink-0 text-kick" /> {GATEAU_NOTE}
              </p>
            </CardContent>
          </Card>

          {/* Conditions d'annulation */}
          <div className="mt-4 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Info className="size-4 text-field shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Annulation :</strong> {RESUME_ANNULATION}</p>
          </div>

          {/* Coordonnées */}
          <div className="mt-6 space-y-4 max-w-md">
            <h3 className="font-bold">Vos coordonnées</h3>
            <p className="text-xs text-muted-foreground">
              Ces données sont utilisées uniquement pour la gestion de votre réservation.{" "}
              <a href="/confidentialite" className="underline">Politique de confidentialité</a>
            </p>
            <div><Label htmlFor="parentName">Nom complet</Label><Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Jean Dupont" /></div>
            <div>
              <Label htmlFor="parentEmail">Email</Label>
              <Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder="jean@email.com" className={emailTouched && parentEmail && !emailValid ? "border-destructive" : ""} />
              {emailTouched && parentEmail && !emailValid && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> Adresse email invalide.
                </p>
              )}
            </div>
            <PhoneField onChange={(_, valid) => setPhoneValid(valid)} />
          </div>

          {/* Paiement */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6">
              <div className="flex justify-between text-lg mb-6">
                <span className="font-bold">Total à payer</span>
                <span className="font-bold text-field">{totalPrice}€</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptCGV" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="acceptCGV" className="text-sm leading-relaxed">
                    J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="underline text-field">Conditions Générales de Vente</a> et la <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline text-field">Politique de confidentialité</a>. <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptNewsletter" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="acceptNewsletter" className="text-sm leading-relaxed text-muted-foreground">
                    Je souhaite recevoir les offres et actualités d&apos;Offside Foot Indoor par email (facultatif).
                  </Label>
                </div>
              </div>

              <button
                onClick={() => {
                  const ref = saveReservation({ type: "anniversaire", total: totalPrice, formule: selectedFormule.name, enfant: childName });
                  router.push(`/confirmation?ref=${ref}`);
                }}
                disabled={!acceptCGV || !parentName || !emailValid || !phoneValid}
                className="btn-glass-field w-full h-14 text-[#0a0a0b] text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Lock className="size-5" /> Payer ma réservation (démo)
              </button>
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5" /> Paiement par carte et Bancontact — bientôt disponible.
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
