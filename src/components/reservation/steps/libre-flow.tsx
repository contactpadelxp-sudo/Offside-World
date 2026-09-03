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
import { libreSlots, type LibreSlot } from "@/data/libre";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, AlertCircle, Users, Calendar } from "lucide-react";

type Step = "creneau" | "recap" | "paiement";
const DATES = [...new Set(libreSlots.map((s) => s.date))];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
}

export function LibreFlow({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("creneau");
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState<LibreSlot | null>(null);
  const [nbPersons, setNbPersons] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const total = selectedSlot ? selectedSlot.price * nbPersons : 0;
  const slotsForDate = libreSlots.filter((s) => s.date === selectedDate);
  const emailValid = isValidEmail(email);

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Calendar className="size-7 text-field" /> Entrée libre
      </h1>

      {step === "creneau" && (
        <FadeIn className="mt-6">
          <p className="text-muted-foreground">Choisissez une date et un créneau.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {DATES.map((d) => (
              <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  selectedDate === d ? "border-field bg-field/10 text-field" : "border-muted hover:border-field/40"
                }`}
              >{formatDate(d)}</button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {slotsForDate.map((slot) => (
              <button key={slot.id} onClick={() => slot.spotsLeft > 0 && setSelectedSlot(slot)} disabled={slot.spotsLeft === 0} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  slot.spotsLeft === 0 ? "opacity-50 cursor-not-allowed" : selectedSlot?.id === slot.id ? "border-field ring-2 ring-field/20" : "hover:border-field/40 card-hover"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{slot.start} – {slot.end}</p>
                      <p className="text-sm text-muted-foreground">{slot.price}€ / personne</p>
                    </div>
                    <Badge variant={slot.spotsLeft > 5 ? "secondary" : slot.spotsLeft > 0 ? "outline" : "destructive"} className="flex items-center gap-1">
                      <Users className="size-3" /> {slot.spotsLeft > 0 ? `${slot.spotsLeft} places` : "Complet"}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          {selectedSlot && (
            <div className="mt-4 max-w-xs">
              <Label htmlFor="nbPersons">Nombre de personnes</Label>
              <Input id="nbPersons" type="number" min={1} max={selectedSlot.spotsLeft} value={nbPersons} onChange={(e) => setNbPersons(Number(e.target.value))} />
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!selectedSlot} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">Continuer <ArrowRight className="size-4" /></Button>
          </div>
        </FadeIn>
      )}

      {step === "recap" && selectedSlot && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Récapitulatif</h2>
          <Card className="mt-4 border-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{formatDate(selectedDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Créneau</span><span className="font-semibold">{selectedSlot.start} – {selectedSlot.end}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Personnes</span><span className="font-semibold">{nbPersons}</span></div>
              <div className="border-t pt-3 flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-field">{total}€</span></div>
            </CardContent>
          </Card>
          <div className="mt-6 space-y-4 max-w-md">
            <h3 className="font-bold">Vos coordonnées</h3>
            <p className="text-xs text-muted-foreground"><a href="/confidentialite" className="underline">Politique de confidentialité</a></p>
            <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder="jean@email.com" className={emailTouched && email && !emailValid ? "border-destructive" : ""} />
              {emailTouched && email && !emailValid && <p className="mt-1 text-sm text-destructive flex items-center gap-1"><AlertCircle className="size-3.5" /> Adresse email invalide.</p>}
            </div>
            <PhoneField onChange={(_, valid) => setPhoneValid(valid)} />
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("paiement")} disabled={!name || !emailValid || !phoneValid} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">Continuer <ArrowRight className="size-4" /></Button>
          </div>
        </FadeIn>
      )}

      {step === "paiement" && selectedSlot && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2"><Lock className="size-5 text-field" /> Paiement</h2>
          <Card className="mt-4 border-2">
            <CardContent className="p-6">
              <div className="flex justify-between text-lg mb-6"><span className="font-bold">Total</span><span className="font-bold text-field">{total}€</span></div>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="cgv" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="cgv" className="text-sm">J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="underline text-field">CGV</a> et la <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline text-field">Politique de confidentialité</a>. <span className="text-destructive">*</span></Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="nl" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="nl" className="text-sm text-muted-foreground">Recevoir les offres par email (facultatif).</Label>
                </div>
              </div>
              <button onClick={() => { const ref = saveReservation({ type: "libre", total }); router.push(`/confirmation?ref=${ref}`); }} disabled={!acceptCGV}
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
