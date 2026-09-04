"use client";

import { useMemo, useState } from "react";
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
import { memoriserRecap } from "@/lib/reservation";
import { useScrollTop } from "@/lib/use-scroll-top";
import { reserverAnniversaire } from "@/app/reservation/actions";
import type { CreneauVue, FormuleVue, OptionVue } from "@/lib/vues";
import { GATEAU_NOTE, OPTION_IMAGES } from "@/data/formules";
import { RESUME_ANNULATION, DELAI_RESERVATION_HEURES } from "@/data/reglement";
import { AlerteCercle, Ballon, Bouclier, Calendrier, Coche, FlecheDroite, FlecheGauche, Gateau, Groupe, Info } from "@/components/icons";

type Step = "formule" | "details" | "creneau" | "paiement";

const STEPS: { key: Step; label: string }[] = [
  { key: "formule", label: "Formule" },
  { key: "details", label: "Détails" },
  { key: "creneau", label: "Créneau" },
  { key: "paiement", label: "Récapitulatif" },
];

/** Dates affichées avant le bouton « voir plus ». */
const DATES_VISIBLES = 12;

export function AnniversaireFlow({
  onBack,
  formules,
  options,
  creneaux,
}: {
  onBack: () => void;
  formules: FormuleVue[];
  options: OptionVue[];
  creneaux: CreneauVue[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("formule");
  const [selectedFormule, setSelectedFormule] = useState<FormuleVue | null>(null);
  const [childCount, setChildCount] = useState(10);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [toutesLesDates, setToutesLesDates] = useState(false);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [acceptCGV, setAcceptCGV] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /* ── Créneaux : dates, espaces et horaires viennent tous de la base ── */

  const jours = useMemo(() => {
    const vus = new Map<string, string>();
    for (const c of creneaux) if (!vus.has(c.jour)) vus.set(c.jour, c.jourLabel);
    return [...vus].map(([jour, label]) => ({ jour, label }));
  }, [creneaux]);

  const espaces = useMemo(() => {
    const vus = new Map<string, { id: string; nom: string; capacite: number }>();
    for (const c of creneaux) {
      if (!vus.has(c.espaceId)) vus.set(c.espaceId, { id: c.espaceId, nom: c.espaceNom, capacite: c.capacite });
    }
    return [...vus.values()].sort((a, b) => a.id.localeCompare(b.id));
  }, [creneaux]);

  const [selectedJour, setSelectedJour] = useState(() => jours[0]?.jour ?? "");
  const [selectedCreneau, setSelectedCreneau] = useState<CreneauVue | null>(null);

  const jourCourant = selectedJour || jours[0]?.jour || "";
  const creneauxDuJour = useMemo(
    () => creneaux.filter((c) => c.jour === jourCourant),
    [creneaux, jourCourant]
  );

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  };

  const optionsTotal = options
    .filter((o) => selectedOptions.includes(o.id))
    .reduce((somme, o) => somme + o.prix, 0);
  const extraChildren = selectedFormule ? Math.max(0, childCount - selectedFormule.enfantsInclus) : 0;
  const formuleTotal = selectedFormule
    ? selectedFormule.prixBase + extraChildren * selectedFormule.prixEnfantSup
    : 0;
  /** Aperçu : le montant qui fera foi est recalculé par le serveur. */
  const totalPrice = formuleTotal + (selectedFormule ? optionsTotal : 0);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const emailValid = isValidEmail(parentEmail);

  // Chaque changement d'étape repart du haut de la page.
  useScrollTop(step);

  async function envoyer() {
    if (!selectedFormule || !selectedCreneau) return;
    setEnvoi(true);
    setErreur(null);

    const resultat = await reserverAnniversaire({
      creneauId: selectedCreneau.id,
      formuleId: selectedFormule.id,
      nbEnfants: childCount,
      enfantPrenom: childName,
      enfantAge: Number(childAge),
      optionsIds: selectedOptions,
      clientNom: parentName,
      clientEmail: parentEmail,
      clientTelephone: phone,
      newsletter: acceptNewsletter,
      cgv: acceptCGV,
    });

    if (!resultat.ok) {
      setEnvoi(false);
      setErreur(resultat.message);
      // Un créneau pris entre-temps : on renvoie l'utilisateur au choix.
      if (resultat.champ === "creneau") {
        setSelectedCreneau(null);
        setStep("creneau");
      }
      return;
    }

    memoriserRecap({
      ref: resultat.reference,
      type: "anniversaire",
      total: resultat.total,
      formule: selectedFormule.nom,
      enfant: childName,
      date: selectedCreneau.jourLabel,
      horaire: `${selectedCreneau.debut} – ${selectedCreneau.fin}`,
    });
    router.push(`/confirmation?ref=${resultat.reference}`);
  }

  if (formules.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl">Anniversaires</h1>
        <p className="mt-4 text-muted-foreground">
          La réservation en ligne est momentanément indisponible. Contactez-nous directement, nous
          prendrons votre demande.
        </p>
        <Button variant="ghost" onClick={onBack} className="mt-6 gap-1.5">
          <FlecheGauche className="size-4" /> Retour
        </Button>
      </div>
    );
  }

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
                {i < stepIndex ? <Coche className="size-4" /> : i + 1}
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
            {formules.length} formules, {formules.length} façons de fêter son anniversaire
          </h2>
          <p className="mt-1 text-muted-foreground">Sélectionnez la formule idéale pour l&apos;anniversaire.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {formules.map((f) => (
              <button key={f.id} onClick={() => setSelectedFormule(f)} className="text-left">
                <Card
                  className={`h-full border-2 transition-all duration-300 card-hover ${
                    selectedFormule?.id === f.id ? "border-field ring-2 ring-field/20" : "hover:border-field/40"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="relative aspect-video rounded-xl bg-gradient-to-br from-field/20 to-kick/20 flex items-center justify-center mb-4 overflow-hidden">
                      <Ballon className="size-10 text-field/60" />
                      {f.image && <Photo src={f.image} alt={`Formule ${f.nom}`} sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />}
                    </div>
                    <h3 className="text-lg font-bold">{f.nom}</h3>
                    {f.accroche && <p className="text-sm text-field font-medium">{f.accroche}</p>}
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                    <p className="mt-3 text-3xl font-bold font-[family-name:var(--font-heading)] text-field">
                      {f.prixBase}€
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jusqu&apos;à {f.enfantsInclus} enfants • +{f.prixEnfantSup}€ par enfant supplémentaire
                    </p>
                    <ul className="mt-3 space-y-1">
                      {f.inclus.map((inc) => (
                        <li key={inc} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Coche className="size-3 text-field mt-0.5 shrink-0" />{inc}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Gateau className="size-3.5 mt-0.5 shrink-0 text-kick" /> {GATEAU_NOTE}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("details")} disabled={!selectedFormule} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <FlecheDroite className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 2: Détails (enfant + options) */}
      {step === "details" && selectedFormule && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Groupe className="size-6 text-field" /> Détails de l&apos;anniversaire
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
              <Input id="childAge" type="number" min={1} max={17} value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="Ex. : 9" />
            </div>
            <div>
              <Label htmlFor="childCount">Nombre d&apos;enfants</Label>
              <Input
                id="childCount"
                type="number"
                min={1}
                max={selectedFormule.enfantsMax}
                value={childCount}
                onChange={(e) => setChildCount(Math.min(selectedFormule.enfantsMax, Math.max(1, Number(e.target.value))))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Forfait jusqu&apos;à {selectedFormule.enfantsInclus} enfants — maximum {selectedFormule.enfantsMax}.
              </p>
            </div>
          </div>

          {/* Détail du prix */}
          <Card className="mt-6 max-w-md border-2 border-field/30">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Formule {selectedFormule.nom} (jusqu&apos;à {selectedFormule.enfantsInclus} enfants)
                </span>
                <span className="font-semibold whitespace-nowrap ml-3">{selectedFormule.prixBase}€</span>
              </div>
              {extraChildren > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {extraChildren} enfant{extraChildren > 1 ? "s" : ""} supplémentaire{extraChildren > 1 ? "s" : ""} × {selectedFormule.prixEnfantSup}€
                  </span>
                  <span className="font-semibold whitespace-nowrap ml-3">+{extraChildren * selectedFormule.prixEnfantSup}€</span>
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
          {options.length > 0 && (
            <>
              <h3 className="mt-8 text-lg font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
                Options supplémentaires
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Facultatif — la décoration, les boissons et la vaisselle sont déjà comprises dans votre formule.
              </p>
              <div className="mt-4 space-y-3">
                {options.map((opt) => (
                  <button key={opt.id} onClick={() => toggleOption(opt.id)} className="w-full text-left">
                    <Card className={`border-2 transition-all duration-300 ${
                      selectedOptions.includes(opt.id) ? "border-field ring-2 ring-field/20" : "hover:border-field/40 card-hover"
                    }`}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-field/5">
                            {OPTION_IMAGES[opt.id] && <Photo src={OPTION_IMAGES[opt.id]} alt={opt.libelle} sizes="80px" className="object-cover" />}
                          </div>
                          <div>
                            <p className="font-semibold">{opt.libelle}</p>
                            {opt.description && <p className="text-sm text-muted-foreground">{opt.description}</p>}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-field whitespace-nowrap ml-4">+{opt.prix}€</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("formule")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("creneau")} disabled={!childName || !childAge} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <FlecheDroite className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 3: Créneau + espace */}
      {step === "creneau" && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Calendrier className="size-6 text-field" /> Choisissez votre créneau
          </h2>
          <p className="mt-1 text-muted-foreground">
            Réservation possible jusqu&apos;à {DELAI_RESERVATION_HEURES} heure avant le début, même à la dernière minute.
          </p>

          {jours.length === 0 ? (
            <p className="mt-6 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground">
              Aucun créneau n&apos;est ouvert pour le moment. Contactez-nous : nous trouverons une date.
            </p>
          ) : (
            <>
              <div className="mt-6">
                <Label>Date</Label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(toutesLesDates ? jours : jours.slice(0, DATES_VISIBLES)).map((j) => (
                    <button
                      key={j.jour}
                      onClick={() => { setSelectedJour(j.jour); setSelectedCreneau(null); }}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium capitalize transition-all duration-300 ${
                        jourCourant === j.jour ? "border-field bg-field/10 text-field" : "border-muted hover:border-field/40"
                      }`}
                    >
                      {j.label}
                    </button>
                  ))}
                  {!toutesLesDates && jours.length > DATES_VISIBLES && (
                    <button
                      onClick={() => setToutesLesDates(true)}
                      className="rounded-xl border-2 border-dashed border-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-field/40 hover:text-foreground transition-all duration-300"
                    >
                      + {jours.length - DATES_VISIBLES} autres dates
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {espaces.map((espace) => {
                  const horaires = creneauxDuJour.filter((c) => c.espaceId === espace.id);
                  if (horaires.length === 0) return null;
                  return (
                    <Card key={espace.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{espace.nom}</h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Groupe className="size-3" /> Capacité : {espace.capacite} enfants
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {horaires.map((c) => {
                            const choisi = selectedCreneau?.id === c.id;
                            return (
                              <button
                                key={c.id}
                                disabled={!c.libre}
                                onClick={() => setSelectedCreneau(c)}
                                className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${
                                  !c.libre
                                    ? "border-destructive/30 bg-destructive/10 text-destructive/70 cursor-not-allowed line-through"
                                    : choisi
                                    ? "border-field bg-field text-[#0a0a0b] shadow-lg shadow-field/20"
                                    : "border-muted hover:border-field/40"
                                }`}
                              >
                                {c.debut} – {c.fin}
                                {!c.libre && <span className="ml-1 text-xs">(pris)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {erreur && (
            <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
              <AlerteCercle className="size-4 shrink-0 mt-0.5" /> {erreur}
            </p>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("details")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <Button onClick={() => setStep("paiement")} disabled={!selectedCreneau} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
              Continuer <FlecheDroite className="size-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {/* STEP 4: Récapitulatif + coordonnées */}
      {step === "paiement" && selectedFormule && selectedCreneau && (
        <FadeIn>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Coche className="size-6 text-field" /> Récapitulatif &amp; coordonnées
          </h2>

          {/* Récap */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-semibold">{selectedFormule.nom}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Enfant fêté</span><span className="font-semibold">{childName} ({childAge} ans)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Nombre d&apos;enfants</span><span className="font-semibold">{childCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold capitalize">{selectedCreneau.jourLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Espace</span><span className="font-semibold">{selectedCreneau.espaceNom}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horaire</span><span className="font-semibold">{selectedCreneau.debut} – {selectedCreneau.fin}</span></div>
              {selectedOptions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-semibold text-right">{options.filter((o) => selectedOptions.includes(o.id)).map((o) => o.libelle).join(", ")}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-field">{totalPrice}€</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Gateau className="size-3.5 mt-0.5 shrink-0 text-kick" /> {GATEAU_NOTE}
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
            <div><Label htmlFor="parentName">Nom complet</Label><Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={120} /></div>
            <div>
              <Label htmlFor="parentEmail">Email</Label>
              <Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} onBlur={() => setEmailTouched(true)} maxLength={254} className={emailTouched && parentEmail && !emailValid ? "border-destructive" : ""} />
              {emailTouched && parentEmail && !emailValid && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlerteCercle className="size-3.5" /> Adresse email invalide.
                </p>
              )}
            </div>
            <PhoneField onChange={(valeur, valide) => { setPhone(valeur); setPhoneValid(valide); }} />
          </div>

          {/* Validation */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6">
              <div className="flex justify-between text-lg mb-6">
                <span className="font-bold">Total</span>
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

              {erreur && (
                <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
                  <AlerteCercle className="size-4 shrink-0 mt-0.5" /> {erreur}
                </p>
              )}

              <button
                onClick={envoyer}
                disabled={envoi || !acceptCGV || !parentName || !emailValid || !phoneValid}
                className="btn-glass-field w-full h-14 text-[#0a0a0b] text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Coche className="size-5" /> {envoi ? "Enregistrement…" : "Confirmer ma réservation"}
              </button>
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Bouclier className="size-3.5" /> Le paiement en ligne arrive bientôt : nous vous recontactons
                pour confirmer et convenir du règlement.
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
