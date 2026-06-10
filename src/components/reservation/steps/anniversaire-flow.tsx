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
import { SummaryBar, TrustRow } from "@/components/reservation/funnel-ui";
import { validateBelgianPhone } from "@/lib/phone";
import { formules, options, type Formule, type Option } from "@/data/formules";
import { salles, timeSlots, isSlotBooked } from "@/data/salles";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Lock,
  Calendar,
  Users,
  Gift,
  AlertCircle,
  ShieldCheck,
  Flame,
} from "lucide-react";

type Step = "formule" | "details" | "creneau" | "paiement";

const STEPS: { key: Step; label: string }[] = [
  { key: "formule", label: "Formule" },
  { key: "details", label: "Détails" },
  { key: "creneau", label: "Créneau" },
  { key: "paiement", label: "Paiement" },
];

const DATES = ["2026-06-14", "2026-06-15", "2026-06-21"];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AnniversaireFlow({
  onBack,
  initialFormuleId,
}: {
  onBack: () => void;
  initialFormuleId?: string;
}) {
  const router = useRouter();
  const initialFormule = formules.find((f) => f.id === initialFormuleId) ?? null;
  const [step, setStep] = useState<Step>(initialFormule ? "details" : "formule");
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(initialFormule);
  const [childCount, setChildCount] = useState(10);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedSalle, setSelectedSalle] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handlePhoneChange = (value: string) => {
    setParentPhone(value);
    if (value) {
      const result = validateBelgianPhone(value);
      setPhoneError(result.valid ? "" : (result.error ?? ""));
    } else {
      setPhoneError("");
    }
  };

  const totalPrice = selectedFormule
    ? selectedFormule.pricePerChild * childCount +
      options.filter((o) => selectedOptions.includes(o.id)).reduce((sum, o) => sum + o.price, 0)
    : 0;

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isPhoneValid = parentPhone && validateBelgianPhone(parentPhone).valid;

  const freeSlotsForDate = (date: string) =>
    salles.reduce(
      (count, salle) =>
        count + timeSlots.filter((slot) => !isSlotBooked(salle.id, date, slot.id)).length,
      0
    );

  const summaryDetail = [
    `${childCount} enfants`,
    selectedSlot && `${formatDate(selectedDate)} · ${timeSlots.find((s) => s.id === selectedSlot)?.start}`,
    selectedOptions.length > 0 && `${selectedOptions.length} option${selectedOptions.length > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="pb-24">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shrink-0 transition-all duration-500 ${
                  i < stepIndex
                    ? "bg-gradient-to-br from-field to-field-dark text-white shadow-lg shadow-field/20"
                    : i === stepIndex
                    ? "bg-gradient-to-br from-field to-field-dark text-white ring-4 ring-field/20 scale-110"
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
          <div className="h-full bg-gradient-to-r from-field to-field-dark rounded-full progress-bar" style={{ width: `${((stepIndex) / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* STEP 1: Formule */}
      {step === "formule" && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre formule</h2>
          <p className="mt-1 text-muted-foreground">Sélectionnez la formule idéale pour l&apos;anniversaire.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-field/20 to-kick/20 flex items-center justify-center mb-4">
                      <CircleDot className="size-10 text-field/60" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{f.name}</h3>
                      {f.id === "bubble-foot" && (
                        <Badge className="bg-kick/10 text-kick border-0">Populaire</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                    <p className="mt-3 text-2xl font-bold font-[family-name:var(--font-heading)] text-field">
                      {f.pricePerChild}€<span className="text-sm font-normal text-muted-foreground">/enfant</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{f.durationMinutes} min • {f.minChildren}–{f.maxChildren} enfants</p>
                    <ul className="mt-3 space-y-1">
                      {f.includes.slice(0, 4).map((inc) => (
                        <li key={inc} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="size-3 text-field mt-0.5 shrink-0" />{inc}
                        </li>
                      ))}
                      {f.includes.length > 4 && (
                        <li className="text-xs text-muted-foreground">+ {f.includes.length - 4} inclus</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("details")} disabled={!selectedFormule} className="btn-glass-field text-white border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 2: Détails (enfant + options) */}
      {step === "details" && selectedFormule && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Users className="size-6 text-field" /> Personnalisez la fête
          </h2>
          <p className="mt-1 text-muted-foreground">
            Formule <strong>{selectedFormule.name}</strong> —{" "}
            <button onClick={() => setStep("formule")} className="underline hover:text-foreground">changer</button>.
            Seules les informations minimales sont collectées.{" "}
            <a href="/confidentialite" className="underline">Politique de confidentialité</a>
          </p>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-bold font-[family-name:var(--font-heading)]">L&apos;enfant fêté</h3>
              <div>
                <Label htmlFor="childName">Prénom de l&apos;enfant fêté</Label>
                <Input id="childName" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Ex. : Lucas" maxLength={50} />
              </div>
              <div>
                <Label htmlFor="childAge">Âge</Label>
                <Input id="childAge" type="number" min={4} max={17} value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="Ex. : 9" />
              </div>
              <div>
                <Label htmlFor="childCount">Nombre d&apos;enfants invités</Label>
                <Input id="childCount" type="number" min={selectedFormule.minChildren} max={selectedFormule.maxChildren} value={childCount} onChange={(e) => setChildCount(Number(e.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">Min. {selectedFormule.minChildren} — Max. {selectedFormule.maxChildren} enfants</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold font-[family-name:var(--font-heading)]">Options en plus (facultatif)</h3>
              {options.map((opt: Option) => {
                const isIncluded = selectedFormule.id === "premium" && ["deco", "gateau", "boissons", "photo"].includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => !isIncluded && toggleOption(opt.id)} disabled={isIncluded} className="w-full text-left">
                    <Card className={`border-2 transition-all duration-300 ${
                      isIncluded ? "opacity-50 border-muted" : selectedOptions.includes(opt.id) ? "border-field ring-2 ring-field/20" : "hover:border-field/40"
                    }`}>
                      <CardContent className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${selectedOptions.includes(opt.id) ? "bg-field/10 text-field" : "bg-muted text-muted-foreground"}`}>
                            <Gift className="size-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{opt.label}</p>
                            {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
                            {isIncluded && <Badge variant="secondary" className="mt-1">Inclus dans Premium</Badge>}
                          </div>
                        </div>
                        <p className="font-bold text-field whitespace-nowrap ml-3 text-sm">+{opt.price}€</p>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("formule")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("creneau")} disabled={!childName || !childAge || childCount < selectedFormule.minChildren} className="btn-glass-field text-white border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 3: Créneau + Salle */}
      {step === "creneau" && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Calendar className="size-6 text-field" /> Choisissez votre créneau
          </h2>
          <p className="mt-1 text-muted-foreground">Sélectionnez une date, une salle et un horaire.</p>

          <div className="mt-6">
            <Label>Date</Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {DATES.map((d) => {
                const free = freeSlotsForDate(d);
                return (
                  <button key={d} onClick={() => { setSelectedDate(d); setSelectedSalle(""); setSelectedSlot(""); }}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                      selectedDate === d ? "border-field bg-field/10 text-field-dark" : "border-muted hover:border-field/40"
                    }`}
                  >
                    <span className="block">{formatDate(d)}</span>
                    {free <= 8 && (
                      <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-kick">
                        <Flame className="size-3" /> Plus que {free} créneaux
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {salles.map((salle) => (
              <Card key={salle.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{salle.name}</h3>
                      <p className="text-sm text-muted-foreground">{salle.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Users className="size-3" /> Capacité : {salle.capacity} enfants</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {timeSlots.map((slot) => {
                      const booked = isSlotBooked(salle.id, selectedDate, slot.id);
                      const isSelected = selectedSalle === salle.id && selectedSlot === slot.id;
                      return (
                        <button key={slot.id} disabled={booked}
                          onClick={() => { setSelectedSalle(salle.id); setSelectedSlot(slot.id); }}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${
                            booked ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed line-through"
                            : isSelected ? "border-field bg-field text-white shadow-lg shadow-field/20"
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
            <Button onClick={() => setStep("paiement")} disabled={!selectedSalle || !selectedSlot} className="btn-glass-field text-white border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 4: Récap + coordonnées + paiement */}
      {step === "paiement" && selectedFormule && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Lock className="size-6 text-field" /> Récapitulatif & paiement
          </h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(20rem,24rem)] items-start">
            <div className="space-y-4 max-w-md">
              <h3 className="font-bold">Vos coordonnées</h3>
              <p className="text-xs text-muted-foreground">
                Ces données sont utilisées uniquement pour la gestion de votre réservation.{" "}
                <a href="/confidentialite" className="underline">Politique de confidentialité</a>
              </p>
              <div><Label htmlFor="parentName">Nom complet</Label><Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Jean Dupont" /></div>
              <div><Label htmlFor="parentEmail">Email</Label><Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="jean@email.com" /></div>
              <div>
                <Label htmlFor="parentPhone">Téléphone</Label>
                <Input id="parentPhone" type="tel" value={parentPhone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="0470 12 34 56" className={phoneError ? "border-destructive" : ""} />
                {phoneError && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" /> {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptCGV" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="acceptCGV" className="text-sm leading-relaxed">
                    J&apos;accepte les <a href="/cgv" target="_blank" className="underline text-field">Conditions Générales de Vente</a> et la <a href="/confidentialite" target="_blank" className="underline text-field">Politique de confidentialité</a>. <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptNewsletter" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="acceptNewsletter" className="text-sm leading-relaxed text-muted-foreground">
                    Je souhaite recevoir les offres et actualités d&apos;Offside World par email (facultatif).
                  </Label>
                </div>
              </div>
            </div>

            <Card className="border-2 lg:sticky lg:top-24">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold font-[family-name:var(--font-heading)] mb-2">Votre réservation</h3>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Formule</span><span className="font-semibold">{selectedFormule.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Enfant fêté</span><span className="font-semibold">{childName} ({childAge} ans)</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Enfants</span><span className="font-semibold">{childCount} × {selectedFormule.pricePerChild}€</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-semibold">{formatDate(selectedDate)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Salle</span><span className="font-semibold">{salles.find((s) => s.id === selectedSalle)?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Horaire</span><span className="font-semibold">{timeSlots.find((s) => s.id === selectedSlot)?.start} – {timeSlots.find((s) => s.id === selectedSlot)?.end}</span></div>
                {options.filter((o) => selectedOptions.includes(o.id)).map((o) => (
                  <div key={o.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{o.label}</span><span className="font-semibold">+{o.price}€</span></div>
                ))}
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-field">{totalPrice}€</span>
                </div>

                <button
                  onClick={() => router.push(`/confirmation?type=anniversaire&formule=${selectedFormule.name}&enfant=${childName}&total=${totalPrice}&ref=OW-${Date.now().toString(36).toUpperCase()}`)}
                  disabled={!acceptCGV || !parentName || !parentEmail || !isPhoneValid}
                  className="btn-glass-paypal w-full h-14 text-white text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="size-5" /> Payer avec PayPal (démo)
                </button>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3.5" /> Aucune donnée de carte stockée.
                </p>
                <TrustRow className="justify-center pt-1" />
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
          </div>
        </FadeIn>
      )}

      <SummaryBar
        visible={Boolean(selectedFormule) && step !== "paiement" && step !== "formule"}
        label={`Anniversaire ${selectedFormule?.name ?? ""}`}
        detail={summaryDetail}
        total={totalPrice}
      />
    </div>
  );
}
