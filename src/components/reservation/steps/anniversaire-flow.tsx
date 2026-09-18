"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChampNombre } from "@/components/reservation/champ-nombre";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn } from "@/components/motion";
import { Photo } from "@/components/photo";
import { PhoneField } from "@/components/reservation/phone-field";
import { isValidEmail } from "@/lib/validation";
import { memoriserRecap } from "@/lib/reservation";
import { mesurer } from "@/lib/mesure";
import { EMAIL } from "@/data/entreprise";
import { useScrollTop } from "@/lib/use-scroll-top";
import { reserverAnniversaire } from "@/lib/actions/reservation";
import type { CreneauVue, FormuleVue, OptionVue } from "@/lib/vues";
import type { RefTitre } from "../reservation-flow";
import { GATEAU_NOTE, OPTION_IMAGES } from "@/data/formules";
import { RESUME_ANNULATION, DELAI_RESERVATION_HEURES } from "@/data/reglement";
import { AlerteCercle, Ballon, Bouclier, Calendrier, ChevronBas, Coche, FlecheDroite, FlecheGauche, Gateau, Groupe, Info } from "@/components/icons";
import { euros } from "@/lib/tarification";

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
  paiementActif,
  onBack,
  titreRef,
  formules,
  options,
  creneaux,
}: {
  paiementActif: boolean;
  onBack: () => void;
  /** Titre de l'étape affichée, qui reçoit le focus — voir `reservation-flow`. */
  titreRef: RefTitre;
  formules: FormuleVue[];
  options: OptionVue[];
  creneaux: CreneauVue[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("formule");

  const [selectedFormule, setSelectedFormule] = useState<FormuleVue | null>(null);
  /*
    Deux jalons du tunnel. Arriver sur « details » suppose qu'une formule a
    été choisie ; arriver sur « paiement » suppose qu'un créneau l'a été et
    que le formulaire est à l'écran. La perte entre ce dernier jalon et la
    réservation est le chiffre qui compte : ce sont les gens qui avaient tout
    choisi et sont partis quand même.
  */
  useEffect(() => {
    if (step === "details") mesurer("formule", selectedFormule?.id);
    else if (step === "paiement") mesurer("formulaire");
  }, [step, selectedFormule?.id]);
  const [childCount, setChildCount] = useState(10);
  const [childName, setChildName] = useState("");
  // 0 signifie « pas encore choisi » : la liste s'ouvre sur un intitulé
  // explicite plutôt que sur un âge présélectionné au hasard.
  const [childAge, setChildAge] = useState(0);
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

  /*
    …et le focus repart du titre de l'étape, sans quoi il resterait sur le
    bouton « Continuer » que l'on vient de quitter : au clavier comme au
    lecteur d'écran, rien ne signalait le passage à l'étape suivante.

    L'arrivée sur le tunnel n'est pas traitée ici mais dans `reservation-flow`,
    qui sait, lui, distinguer un clic sur une activité d'un simple chargement
    de page avec `?activite=…` dans l'URL.
  */
  const premiereEtape = useRef(true);
  useEffect(() => {
    if (premiereEtape.current) {
      premiereEtape.current = false;
      return;
    }
    titreRef.current?.focus({ preventScroll: true });
  }, [step, titreRef]);

  /*
    CE QUI MANQUE, DIT EN TOUTES LETTRES.

    Le bouton final dépend de cinq conditions. Désactivé, il ne disait rien :
    on cliquait, rien ne se passait, et il fallait deviner laquelle des cinq
    bloquait. Le cas le plus fréquent est la case des CGV — obligatoire, et
    facile à manquer puisqu'elle est sous le récapitulatif.

    On liste donc ce qui reste à faire. C'est aussi un garde-fou pour nous : le
    jour où une condition est ajoutée au bouton sans être ajoutée ici, le
    message redevient incomplet, et ça se voit tout de suite à l'écran.
  */
  /*
    CE QUI MANQUE EST ÉCRIT, À CHAQUE ÉTAPE QUI BLOQUE.

    La dernière étape le faisait déjà — c'est celle qui engage à payer. Les
    étapes intermédiaires, non : « Continuer » se grisait sans un mot. Sur
    l'étape des détails, deux champs le commandent, dont un menu déroulant
    d'âge resté sur « Choisir l'âge ». On remplit le prénom, on ne voit pas
    que l'âge manque, et le bouton est mort sans explication.

    C'est le même défaut que sur le bouton d'envoi d'un devis au back-office,
    corrigé là-bas : un bouton désactivé qui ne dit pas pourquoi oblige à
    deviner.
  */
  const manquantsDetails = [
    !childName && "le prénom de la personne fêtée",
    !childAge && "son âge",
  ].filter(Boolean) as string[];

  const manquants = [
    !parentName && "votre nom",
    !emailValid && "une adresse e-mail valide",
    !phoneValid && "un numéro de téléphone valide",
    !acceptCGV && "l'acceptation des conditions générales",
  ].filter(Boolean) as string[];

  async function envoyer() {
    if (!selectedFormule || !selectedCreneau) return;
    setEnvoi(true);
    setErreur(null);

    const resultat = await reserverAnniversaire({
      creneauId: selectedCreneau.id,
      formuleId: selectedFormule.id,
      nbEnfants: childCount,
      enfantPrenom: childName,
      enfantAge: childAge,
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

    mesurer("reservation", "anniversaire");
    memoriserRecap({
      ref: resultat.reference,
      type: "anniversaire",
      total: resultat.total,
      formule: selectedFormule.nom,
      enfant: childName,
      date: selectedCreneau.jourLabel,
      horaire: `${selectedCreneau.debut} – ${selectedCreneau.fin}`,
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

  if (formules.length === 0) {
    return (
      <div>
        {/* `tabIndex={-1}` : focalisable par programme seulement, pas à la tabulation. */}
        <h1 ref={titreRef} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)] md:text-3xl">Anniversaires</h1>
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
          <h2 ref={titreRef} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            {formules.length} formules, {formules.length} façons de fêter son anniversaire
          </h2>
          <p className="mt-1 text-muted-foreground">Sélectionnez la formule idéale pour l&apos;anniversaire.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/*
              `aria-pressed` : LA FORMULE CHOISIE NE SE VOYAIT QU'À SA BORDURE.

              Une bordure verte est invisible pour un lecteur d'écran, et pour
              quiconque ne distingue pas cette nuance. On entendait quatre fois
              « Formule Découverte, bouton », sans jamais savoir laquelle était
              retenue — ni même qu'un choix avait été enregistré au clic.
            */}
            {formules.map((f) => (
              <button key={f.id} onClick={() => setSelectedFormule(f)} aria-pressed={selectedFormule?.id === f.id} className="text-left">
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
                      {euros(f.prixBase)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jusqu&apos;à {f.enfantsInclus} enfants • +{euros(f.prixEnfantSup)} par enfant supplémentaire
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
          <h2 ref={titreRef} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Groupe className="size-6 text-field" /> Détails de l&apos;anniversaire
          </h2>
          <p className="mt-1 text-muted-foreground">
            {/*
              « PARTICIPANTS » ET NON « ENFANTS », DEPUIS LE 17 SEPTEMBRE 2026.

              Brahim a ouvert les anniversaires aux adultes — « pas de limite
              vu que bubble possible pour adulte ». L'âge accepté va donc de
              4 ans à sans limite. Mais tout le tunnel disait « enfant » :
              quelqu'un qui réserve son propre anniversaire à 35 ans lisait
              « Quelques infos sur l'enfant fêté » et « Nombre d'enfants ».

              Les noms en base restent `nb_enfants` et `prix_enfant_sup_cents` :
              renommer des colonnes pour une question de vocabulaire coûterait
              une migration et casserait les réservations existantes, sans rien
              apporter. C'est ce que le client LIT qui change.
            */}
            Quelques infos sur la personne fêtée, puis personnalisez avec nos extras.{" "}
            <a href="/confidentialite" className="underline py-1">Politique de confidentialité</a>
          </p>

          {/* Infos sur la personne fêtée */}
          <div className="mt-6 max-w-md space-y-4">
            <div>
              <Label htmlFor="childName">Prénom de la personne fêtée</Label>
              <Input id="childName" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Ex. : Lucas" maxLength={50} />
            </div>
            <div>
              <Label htmlFor="childAge">Âge</Label>
              <div className="relative">
                <select
                  id="childAge"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  style={{ colorScheme: "dark" }}
                  className="h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-9 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                >
                  <option value={0}>Choisir l&apos;âge</option>
                  {/*
                    DE 4 À 60 ANS, ET PAS DE 1 À 17.

                    La liste s'arrêtait à 17 ans : un anniversaire d'adulte —
                    le Bubble Foot se joue aussi entre grands — était
                    impossible à réserver, et le serveur le refusait
                    également. Brahim a précisé le 17 septembre 2026 : à
                    partir de 4 ans, sans limite haute.

                    60 est une borne de LISTE, pas d'âge : au-delà, dérouler
                    des dizaines de lignes coûte plus qu'il ne sert, et le
                    serveur accepte jusqu'à 99 de toute façon.
                  */}
                  {Array.from({ length: 57 }, (_, i) => i + 4).map((n) => (
                    <option key={n} value={n}>{n} ans</option>
                  ))}
                </select>
                <ChevronBas aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <ChampNombre
              id="childCount"
              label="Nombre de participants"
              min={1}
              max={selectedFormule.enfantsMax}
              valeur={childCount}
              onChange={setChildCount}
              aide={`Forfait jusqu'à ${selectedFormule.enfantsInclus} participants — maximum ${selectedFormule.enfantsMax}.`}
            />
          </div>

          {/* Détail du prix */}
          <Card className="mt-6 max-w-md border-2 border-field/30">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Formule {selectedFormule.nom} (jusqu&apos;à {selectedFormule.enfantsInclus} participants)
                </span>
                <span className="font-semibold whitespace-nowrap ml-3">{euros(selectedFormule.prixBase)}</span>
              </div>
              {extraChildren > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {extraChildren} participant{extraChildren > 1 ? "s" : ""} supplémentaire{extraChildren > 1 ? "s" : ""} × {euros(selectedFormule.prixEnfantSup)}
                  </span>
                  <span className="font-semibold whitespace-nowrap ml-3">+{euros(extraChildren * selectedFormule.prixEnfantSup)}</span>
                </div>
              )}
              {optionsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-semibold whitespace-nowrap ml-3">+{euros(optionsTotal)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-bold">Total TVAC</span>
                <span className="font-bold text-field">{euros(totalPrice)}</span>
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
                  // `aria-pressed` : une option cochée ne se distinguait, elle aussi, que par sa bordure.
                  <button key={opt.id} onClick={() => toggleOption(opt.id)} aria-pressed={selectedOptions.includes(opt.id)} className="w-full text-left">
                    <Card className={`border-2 transition-all duration-300 ${
                      selectedOptions.includes(opt.id) ? "border-field ring-2 ring-field/20" : "hover:border-field/40 card-hover"
                    }`}>
                      {/*
                        LA VIGNETTE N'EXISTE QUE S'IL Y A UNE IMAGE.

                        Le cadre de 80 × 56 était rendu dans tous les cas, et
                        `OPTION_IMAGES` est une table écrite en dur, indexée par
                        l'identifiant de l'option : toute option créée depuis le
                        back-office reçoit un identifiant de base qui n'y figure
                        pas. Elle s'affichait donc avec un rectangle teinté vide
                        qui mangeait 92 px — presque un tiers de la largeur d'un
                        téléphone de 375 px —, et « Photographe professionnel
                        sur toute la durée » partait sur quatre lignes dans ce
                        qu'il en restait.

                        `min-w-0` sur la colonne de texte : sans lui, un libellé
                        d'un seul mot long refuserait de se replier et pousserait
                        le prix hors de la carte.
                      */}
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {OPTION_IMAGES[opt.id] && (
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-field/5">
                              <Photo src={OPTION_IMAGES[opt.id]} alt="" sizes="80px" className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold">{opt.libelle}</p>
                            {opt.description && <p className="text-sm text-muted-foreground">{opt.description}</p>}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-field whitespace-nowrap">+{euros(opt.prix)}</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("formule")} className="gap-1.5"><FlecheGauche className="size-4" /> Retour</Button>
            <div className="flex flex-col items-end gap-1.5">
              <Button onClick={() => setStep("creneau")} disabled={manquantsDetails.length > 0} className="btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
                Continuer <FlecheDroite className="size-4" />
              </Button>
              {/*
                `aria-live="polite"` et non `role="alert"` : ce n'est pas une
                erreur, c'est l'état d'un formulaire en cours de remplissage.
                Une alerte couperait la parole à chaque frappe ; « poli »
                attend une pause. `aria-atomic` fait relire la phrase entière,
                sinon seule la moitié modifiée de la liste serait annoncée.

                Sans cela, la liste ne servait qu'à ceux qui la voyaient : le
                bouton « Continuer » restait grisé, muet, sans dire ce qui
                manque — exactement le défaut que cette liste devait corriger.
              */}
              {manquantsDetails.length > 0 && (
                <p aria-live="polite" aria-atomic="true" className="flex items-start gap-1.5 text-right text-sm text-muted-foreground">
                  <AlerteCercle className="mt-0.5 size-4 shrink-0 text-kick" />
                  <span>
                    Il manque {manquantsDetails.length > 1
                      ? `${manquantsDetails.slice(0, -1).join(", ")} et ${manquantsDetails[manquantsDetails.length - 1]}`
                      : manquantsDetails[0]}.
                  </span>
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      )}

      {/* STEP 3: Créneau + espace */}
      {step === "creneau" && (
        <FadeIn>
          <h2 ref={titreRef} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Calendrier className="size-6 text-field" /> Choisissez votre créneau
          </h2>
          <p className="mt-1 text-muted-foreground">
            Réservation possible jusqu&apos;à {DELAI_RESERVATION_HEURES} heure avant le début, même à la dernière minute.
          </p>

          {jours.length === 0 ? (
            <p className="mt-6 rounded-xl border border-field/20 bg-field/5 p-4 text-sm text-muted-foreground">
              Aucun créneau n&apos;est ouvert pour le moment. Écrivez-nous à{" "}
              <a href={`mailto:${EMAIL}`} className="font-medium text-field underline underline-offset-2">
                {EMAIL}
              </a>{" "}
              : nous trouverons une date.
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
                      // La date active n'était signalée que par la couleur de sa bordure.
                      aria-pressed={jourCourant === j.jour}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
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
                              <Groupe className="size-3" /> Capacité : {espace.capacite} personnes
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
                                // Le créneau retenu n'était signalé que par son fond vert.
                                aria-pressed={choisi}
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

          {/*
            `role="alert"` : LE REFUS DU SERVEUR N'ÉTAIT JAMAIS ANNONCÉ.

            Le message apparaît loin du bouton qui vient d'être cliqué, et sur
            cette étape il arrive APRÈS un retour automatique depuis le
            récapitulatif (créneau pris entre-temps). Sans annonce, on se
            retrouvait sur une page qui a changé toute seule, sans savoir
            pourquoi ni que la réservation avait échoué.
          */}
          {erreur && (
            <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
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
          <h2 ref={titreRef} tabIndex={-1} className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Coche className="size-6 text-field" /> Récapitulatif &amp; coordonnées
          </h2>

          {/* Récap */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Formule</span><span className="font-semibold">{selectedFormule.nom}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Personne fêtée</span><span className="font-semibold">{childName} ({childAge} ans)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Participants</span><span className="font-semibold">{childCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{selectedCreneau.jourLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Espace</span><span className="font-semibold">{selectedCreneau.espaceNom}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horaire</span><span className="font-semibold">{selectedCreneau.debut} – {selectedCreneau.fin}</span></div>
              {selectedOptions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-semibold text-right">{options.filter((o) => selectedOptions.includes(o.id)).map((o) => o.libelle).join(", ")}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between text-lg">
                <span className="font-bold">Total TVAC</span>
                <span className="font-bold text-field">{euros(totalPrice)}</span>
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
              <a href="/confidentialite" className="underline py-1">Politique de confidentialité</a>
            </p>
            <div><Label htmlFor="parentName">Nom complet</Label><Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={120} /></div>
            <div>
              <Label htmlFor="parentEmail">Email</Label>
              <Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} onBlur={() => setEmailTouched(true)} maxLength={254} className={emailTouched && parentEmail && !emailValid ? "border-destructive" : ""} />
              {/*
                `role="alert"` : le message surgit quand on QUITTE le champ,
                donc au moment où le focus est déjà ailleurs. Sans annonce, on
                continuait le formulaire sans savoir que l'adresse était
                refusée — et le bouton final restait grisé sans explication.
              */}
              {emailTouched && parentEmail && !emailValid && (
                <p role="alert" className="mt-1 text-sm text-destructive flex items-center gap-1">
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
                <span className="font-bold">Total TVAC</span>
                <span className="font-bold text-field">{euros(totalPrice)}</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptCGV" checked={acceptCGV} onCheckedChange={(v) => setAcceptCGV(v === true)} />
                  <Label htmlFor="acceptCGV" className="block text-sm leading-relaxed">
                    J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="underline text-field py-1">Conditions Générales de Vente</a> et la <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline text-field py-1">Politique de confidentialité</a>. <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="acceptNewsletter" checked={acceptNewsletter} onCheckedChange={(v) => setAcceptNewsletter(v === true)} />
                  <Label htmlFor="acceptNewsletter" className="block text-sm leading-relaxed text-muted-foreground">
                    Je souhaite recevoir les offres et actualités d&apos;Offside Foot Indoor par email (facultatif).
                  </Label>
                </div>
              </div>

              {/* Même raison qu'à l'étape des créneaux : un refus muet laisse croire que le clic n'a rien fait. */}
              {erreur && (
                <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
                  <AlerteCercle className="size-4 shrink-0 mt-0.5" /> {erreur}
                </p>
              )}

              <button
                onClick={envoyer}
                disabled={envoi || !acceptCGV || !parentName || !emailValid || !phoneValid}
                className="btn-glass-field w-full h-14 text-[#0a0a0b] text-lg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Coche className="size-5" />
                {envoi
                  ? "Enregistrement…"
                  : paiementActif
                    ? `Payer ${euros(totalPrice)}`
                    : "Confirmer ma réservation"}
              </button>

              {/* Informatif, comme à l'étape des détails : « poli » plutôt qu'alerte. */}
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
                LE BOUTON DIT CE QU'IL FAIT. L'article VI.46 §2 du Code de droit
                économique impose une formule dénuée d'ambiguïté sur un bouton
                qui engage à payer, et sa sanction n'est pas symbolique : le
                consommateur n'est pas lié par la commande. « Confirmer ma
                réservation » au-dessus de « le paiement arrive bientôt », alors
                que le clic débitait la carte, cochait toutes les cases de la
                pratique trompeuse.
              */}
              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <Bouclier className="size-3.5 shrink-0" />
                {paiementActif ? (
                  <span>
                    Paiement sécurisé de <strong>{euros(totalPrice)} TVAC</strong> par Bancontact ou carte.
                    Activité à date déterminée : pas de droit de rétractation.
                  </span>
                ) : (
                  <span>
                    Nous vous recontactons pour confirmer votre créneau et convenir du règlement.
                  </span>
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
