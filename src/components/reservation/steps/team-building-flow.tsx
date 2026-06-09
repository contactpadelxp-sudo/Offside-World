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
import { validateBelgianPhone } from "@/lib/phone";
import { teamBuildingPackages, teamBuildingSlots, type TeamBuildingPackage, type TeamBuildingSlot } from "@/data/team-building";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, AlertCircle, Building2, Users, Check, Calendar } from "lucide-react";

type Step = "formule" | "creneau" | "recap" | "paiement";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
}

export function TeamBuildingFlow({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("formule");
  const [selectedPkg, setSelectedPkg] = useState<TeamBuildingPackage | null>(null);
  const [nbPeople, setNbPeople] = useState(15);
  const [selectedSlot, setSelectedSlot] = useState<TeamBuildingSlot | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [message, setMessage] = useState("");
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const total = selectedPkg ? selectedPkg.pricePerPerson * nbPeople : 0;
  const isPhoneValid = phone && validateBelgianPhone(phone).valid;

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value) { const r = validateBelgianPhone(value); setPhoneError(r.valid ? "" : (r.error ?? "")); }
    else setPhoneError("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Building2 className="size-7 text-violet-600" /> Team Building
      </h1>
      <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
        <Calendar className="size-4" /> Disponible les <strong>lundi, mardi, jeudi et samedi à partir de 18h</strong>.
      </p>

      {step === "formule" && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre formule</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {teamBuildingPackages.map((pkg) => (
              <button key={pkg.id} onClick={() => setSelectedPkg(pkg)} className="text-left">
                <Card className={`h-full border-2 transition-all duration-300 card-hover ${
                  selectedPkg?.id === pkg.id ? "border-violet-500 ring-2 ring-violet-500/20" : "hover:border-violet-400/40"
                }`}>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                    <p className="mt-3 text-2xl font-bold font-[family-name:var(--font-heading)] text-violet-600">
                      {pkg.pricePerPerson}€<span className="text-sm font-normal text-muted-foreground">/pers.</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="size-3" /> {pkg.durationMinutes} min • {pkg.minPeople}–{pkg.maxPeople} pers.
                    </p>
                    <ul className="mt-3 space-y-1">
                      {pkg.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="size-3 text-violet-500 mt-0.5 shrink-0" />{inc}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          {selectedPkg && (
            <div className="mt-6 max-w-xs">
              <Label>Nombre de participants</Label>
              <Input type="number" min={selectedPkg.minPeople} max={selectedPkg.maxPeople} value={nbPeople} onChange={(e) => setNbPeople(Number(e.target.value))} />
              <p className="mt-1 text-xs text-muted-foreground">{selectedPkg.minPeople}–{selectedPkg.maxPeople} personnes</p>
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("creneau")} disabled={!selectedPkg || nbPeople < (selectedPkg?.minPeople ?? 0)} className="btn-glass-violet text-white border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {step === "creneau" && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Choisissez votre créneau</h2>
          <div className="mt-4 grid gap-3">
            {teamBuildingSlots.map((slot) => (
              <button key={slot.id} onClick={() => slot.available && setSelectedSlot(slot)} disabled={!slot.available} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  !slot.available ? "opacity-50 cursor-not-allowed" : selectedSlot?.id === slot.id ? "border-violet-500 ring-2 ring-violet-500/20" : "hover:border-violet-400/40 card-hover"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold capitalize">{slot.dayOfWeek} — {formatDate(slot.date)}</p>
                      <p className="text-sm text-muted-foreground">{slot.start} – {slot.end}</p>
                    </div>
                    <Badge variant={slot.available ? "secondary" : "destructive"}>{slot.available ? "Disponible" : "Réservé"}</Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("formule")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!selectedSlot} className="btn-glass-violet text-white border-0 gap-1.5">Continuer <ArrowRight className="size-4" /></Button>
          </div>
        </FadeIn>
      )}

      {step === "recap" && selectedPkg && selectedSlot && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Récapitulatif</h2>
          <Card className="mt-4 border-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-semibold">{selectedPkg.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Participants</span><span className="font-semibold">{nbPeople}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold capitalize">{selectedSlot.dayOfWeek} {formatDate(selectedSlot.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horaire</span><span className="font-semibold">{selectedSlot.start} – {selectedSlot.end}</span></div>
              <div className="border-t pt-3 flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-violet-600">{total}€</span></div>
            </CardContent>
          </Card>
          <div className="mt-6 space-y-4 max-w-md">
            <h3 className="font-bold">Coordonnées entreprise</h3>
            <p className="text-xs text-muted-foreground"><a href="/confidentialite" className="underline">Politique de confidentialité</a></p>
            <div><Label>Entreprise</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="TechCorp SA" /></div>
            <div><Label>Nom du contact</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div>
              <Label>Téléphone</Label>
              <Input type="tel" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="0470 12 34 56" className={phoneError ? "border-destructive" : ""} />
              {phoneError && <p className="mt-1 text-sm text-destructive flex items-center gap-1"><AlertCircle className="size-3.5" /> {phoneError}</p>}
            </div>
            <div>
              <Label>Message / demande spéciale (facultatif)</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("paiement")} disabled={!companyName || !contactName || !email || !isPhoneValid} className="btn-glass-violet text-white border-0 gap-1.5">
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {step === "paiement" && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2"><Lock className="size-5 text-violet-600" /> Paiement</h2>
          <Card className="mt-4 border-2">
            <CardContent className="p-6">
              <div className="flex justify-between text-lg mb-6"><span className="font-bold">Total</span><span className="font-bold text-violet-600">{total}€</span></div>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="cgv" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="cgv" className="text-sm">J&apos;accepte les <a href="/cgv" target="_blank" className="underline text-violet-600">CGV</a> et la <a href="/confidentialite" target="_blank" className="underline text-violet-600">Politique de confidentialité</a>. <span className="text-destructive">*</span></Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="nl" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="nl" className="text-sm text-muted-foreground">Recevoir les offres par email (facultatif).</Label>
                </div>
              </div>
              <button onClick={() => router.push(`/confirmation?type=team-building&total=${total}`)} disabled={!acceptCGV}
                className="btn-glass-paypal w-full h-14 text-white text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                <Lock className="size-5" /> Payer avec PayPal (démo)
              </button>
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><ShieldCheck className="size-3.5" /> Paiement sécurisé — Aucune donnée de carte stockée.</p>
            </CardContent>
          </Card>
          <div className="mt-4"><Button variant="ghost" onClick={() => setStep("recap")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button></div>
        </FadeIn>
      )}
    </div>
  );
}
