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
import { footSlots, EXTERNAL_BOOKING_LINKS, type FootSlot } from "@/data/foot";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, AlertCircle, CalendarDays, ExternalLink, Trophy, Lightbulb } from "lucide-react";

type Step = "mode" | "creneau" | "recap" | "paiement";
const DATES = [...new Set(footSlots.map((s) => s.date))];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
}

export function FootFlow({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState<FootSlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const slotsForDate = footSlots.filter((s) => s.date === selectedDate);
  const isPhoneValid = phone && validateBelgianPhone(phone).valid;

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value) { const r = validateBelgianPhone(value); setPhoneError(r.valid ? "" : (r.error ?? "")); }
    else setPhoneError("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl flex items-center gap-2">
        <Trophy className="size-7 text-field" /> Location de terrain
      </h1>

      {step === "mode" && (
        <FadeIn className="mt-6">
          <p className="text-muted-foreground">Comment souhaitez-vous réserver ?</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button onClick={() => setStep("creneau")} className="text-left">
              <Card className="h-full border-2 hover:border-field transition-all duration-300 card-hover">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center rounded-xl bg-field/10 p-3 text-field">
                    <CalendarDays className="size-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Réserver ici</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Choisissez un créneau et payez directement en ligne.</p>
                </CardContent>
              </Card>
            </button>
            <div>
              <Card className="h-full border-2 border-muted">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center rounded-xl bg-muted p-3 text-muted-foreground">
                    <ExternalLink className="size-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Réserver via un partenaire</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Retrouvez nos terrains sur Playtomic ou Sport Finder.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <a href={EXTERNAL_BOOKING_LINKS.playtomic} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-field/30 px-4 py-2.5 text-sm font-medium text-field-dark hover:bg-field/10 transition-all duration-300">
                      Playtomic <ExternalLink className="size-3.5" />
                    </a>
                    <a href={EXTERNAL_BOOKING_LINKS.sportfinder} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-field/30 px-4 py-2.5 text-sm font-medium text-field-dark hover:bg-field/10 transition-all duration-300">
                      Sport Finder <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-8"><Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button></div>
        </FadeIn>
      )}

      {step === "creneau" && (
        <FadeIn className="mt-6">
          <p className="text-muted-foreground">Choisissez votre créneau.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {DATES.map((d) => (
              <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  selectedDate === d ? "border-field bg-field/10 text-field-dark" : "border-muted hover:border-field/40"
                }`}>{formatDate(d)}</button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {slotsForDate.map((slot) => (
              <button key={slot.id} onClick={() => slot.available && setSelectedSlot(slot)} disabled={!slot.available} className="text-left">
                <Card className={`border-2 transition-all duration-300 ${
                  !slot.available ? "opacity-50 cursor-not-allowed" : selectedSlot?.id === slot.id ? "border-field ring-2 ring-field/20" : "hover:border-field/40 card-hover"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{slot.start} – {slot.end}</p>
                      <p className="text-lg font-bold text-field">{slot.price}€</p>
                    </div>
                    <Badge variant={slot.available ? "secondary" : "destructive"}>{slot.available ? "Disponible" : "Indisponible"}</Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-field/5 border border-field/20 p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Lightbulb className="size-5 text-field shrink-0 mt-0.5" />
            <p><strong>Inclus :</strong> éclairage, ballon, vestiaires, chasubles.</p>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("mode")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("recap")} disabled={!selectedSlot} className="btn-glass-field text-white border-0 gap-1.5">Continuer <ArrowRight className="size-4" /></Button>
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
              <div className="flex justify-between"><span className="text-muted-foreground">Inclus</span><span className="font-semibold">Éclairage, ballon, vestiaires</span></div>
              <div className="border-t pt-3 flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-field">{selectedSlot.price}€</span></div>
            </CardContent>
          </Card>
          <div className="mt-6 space-y-4 max-w-md">
            <h3 className="font-bold">Vos coordonnées</h3>
            <p className="text-xs text-muted-foreground"><a href="/confidentialite" className="underline">Politique de confidentialité</a></p>
            <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div>
              <Label>Téléphone</Label>
              <Input type="tel" value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="0470 12 34 56" className={phoneError ? "border-destructive" : ""} />
              {phoneError && <p className="mt-1 text-sm text-destructive flex items-center gap-1"><AlertCircle className="size-3.5" /> {phoneError}</p>}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("creneau")} className="gap-1.5"><ArrowLeft className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("paiement")} disabled={!name || !email || !isPhoneValid} className="btn-glass-field text-white border-0 gap-1.5">Continuer <ArrowRight className="size-4" /></Button>
          </div>
        </FadeIn>
      )}

      {step === "paiement" && selectedSlot && (
        <FadeIn className="mt-6">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2"><Lock className="size-5 text-field" /> Paiement</h2>
          <Card className="mt-4 border-2">
            <CardContent className="p-6">
              <div className="flex justify-between text-lg mb-6"><span className="font-bold">Total</span><span className="font-bold text-field">{selectedSlot.price}€</span></div>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="cgv" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="cgv" className="text-sm">J&apos;accepte les <a href="/cgv" target="_blank" className="underline text-field">CGV</a> et la <a href="/confidentialite" target="_blank" className="underline text-field">Politique de confidentialité</a>. <span className="text-destructive">*</span></Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="nl" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="nl" className="text-sm text-muted-foreground">Recevoir les offres par email (facultatif).</Label>
                </div>
              </div>
              <button onClick={() => router.push(`/confirmation?type=foot&total=${selectedSlot.price}`)} disabled={!acceptCGV}
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
