"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Coche, Cookie, Croix, Reglages } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";

/*
  La catégorie « Marketing » a été retirée : elle proposait au visiteur de
  consentir à de la publicité ciblée et à du retargeting alors qu'aucun outil
  de ce genre n'existe sur le site. Ce n'était pas seulement inutile — le RGPD
  exige que l'information donnée soit exacte, et annoncer une finalité qu'on ne
  poursuit pas est une information fausse sur un document public. Accessoirement,
  une troisième case à trancher poussait à tout refuser en bloc, y compris la
  mesure d'audience, qui, elle, existe vraiment.

  Le jour où une publicité Meta ou Google sera réellement installée, la
  catégorie devra revenir EN MÊME TEMPS que l'outil, jamais avant.

  Les consentements déjà enregistrés chez les visiteurs contiennent encore une
  clé `marketing` : elle est simplement ignorée à la relecture, rien ne casse.
*/
interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  date?: number;
}

const COOKIE_KEY = "offside_cookie_consent";
// Le consentement doit être renouvelé périodiquement (recommandation ~6 à 13 mois)
const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180; // 6 mois

function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isConsentValid(consent: CookieConsent | null): boolean {
  if (!consent || typeof consent.date !== "number") return false;
  return Date.now() - consent.date < CONSENT_MAX_AGE_MS;
}

function storeConsent(consent: CookieConsent) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...consent, date: Date.now() }));
  // La mesure d'audience écoute cet événement : sans lui, un visiteur qui
  // accepte ne serait compté qu'à partir de la page SUIVANTE, et on perdrait
  // la première — celle qui porte la provenance.
  window.dispatchEvent(new Event("cookie-consent"));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bandeau = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    // Ré-affiche si aucun consentement OU s'il a expiré
    if (isConsentValid(getStoredConsent())) return;
    const t = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(t);
  }, []);

  /**
   * Réserve en bas de page la hauteur qu'occupe le bandeau.
   *
   * Il est en `position: fixed` : sans cela, il recouvre ce qui se trouve au
   * bas de l'écran, et le recouvrement rend le clic impossible — pas seulement
   * illisible. Sur mobile, le bouton « Voir les créneaux » de la page « Louer
   * un terrain » était ainsi inatteignable pour tout visiteur n'ayant pas
   * encore répondu au bandeau, c'est-à-dire pour tout nouveau visiteur.
   *
   * La hauteur est mesurée plutôt que devinée : elle change selon la longueur
   * du texte, et double quand on déplie « Personnaliser ».
   */
  useEffect(() => {
    const racine = document.documentElement;
    const remettreAZero = () => racine.style.setProperty("--bandeau-cookies", "0px");

    if (!visible) {
      remettreAZero();
      return;
    }
    const el = bandeau.current;
    if (!el) return;

    const mesurer = () => racine.style.setProperty("--bandeau-cookies", `${el.offsetHeight}px`);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => {
      observateur.disconnect();
      remettreAZero();
    };
  }, [visible]);

  const save = useCallback(
    (consent: CookieConsent) => {
      storeConsent(consent);
      setVisible(false);
    },
    []
  );

  const acceptAll = () => save({ necessary: true, analytics: true });
  const refuseAll = () => save({ necessary: true, analytics: false });
  const saveChoices = () => save({ necessary: true, analytics });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          ref={bandeau}
          className="fixed inset-x-0 bottom-0 z-50 p-2.5 sm:p-4"
        >
          {/*
            COMPACT SUR TÉLÉPHONE, ET CE N'EST PAS UNE QUESTION DE GOÛT.

            Le panneau faisait 282 à 346 px de haut. Mesuré à la première
            visite, c'est-à-dire la seule où ce bandeau existe : en 320, 360 et
            375 px de large, AUCUNE des quatre activités du hero n'était
            visible. Le visiteur arrivait sur une page dont toute l'offre était
            masquée par une demande de consentement.

            Ce qui a été retiré ne l'est que sous 640 px, et rien de ce que la
            loi impose n'en fait partie : « Tout accepter » et « Tout refuser »
            gardent exactement le même poids visuel — même taille, même
            largeur, côte à côte —, « Personnaliser » reste accessible d'un
            clic, et le lien vers la politique cookies reste là. Ce qui part,
            c'est l'icône décorative et une phrase d'explication que la page
            liée développe bien mieux.
          */}
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card/95 backdrop-blur-xl p-3.5 shadow-2xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kick/10 text-kick sm:flex">
                <Cookie className="size-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold sm:text-base">Ce site utilise des cookies</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground sm:mt-1 sm:text-sm">
                  <span className="hidden sm:inline">
                    Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez
                    accepter, refuser ou personnaliser vos choix.{" "}
                  </span>
                  <span className="sm:hidden">Mesure d&apos;audience anonyme, à votre choix. </span>
                  <a
                    href="/politique-cookies"
                    className="inline-flex min-h-6 items-center underline hover:text-primary transition-colors"
                  >
                    En savoir plus
                  </a>
                  {!showDetails && (
                    <>
                      <span className="sm:hidden"> · </span>
                      <button
                        type="button"
                        onClick={() => setShowDetails(true)}
                        className="inline-flex min-h-6 items-center underline transition-colors hover:text-primary sm:hidden"
                      >
                        Personnaliser
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked disabled className="accent-primary" />
                      <span className="font-medium">Nécessaires</span>
                      <span className="text-muted-foreground">(toujours actifs)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="font-medium">Mesure d&apos;audience</span>
                      <span className="text-muted-foreground">(anonyme)</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/*
              Refuser et Accepter ont le même poids visuel — même taille, même
              largeur, côte à côte. C'est une exigence, pas une préférence : un
              refus rendu plus difficile qu'une acceptation vicie le
              consentement.

              La rangée est HORIZONTALE dès le téléphone. Elle était en colonne,
              et `flex-1` y pilotait alors la hauteur : les deux boutons étaient
              écrasés à 22 px, sous le minimum tactile. En ligne, `flex-1`
              égalise les largeurs — ce qu'on veut — et `min-h-10` garantit la
              hauteur.
            */}
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              <Button onClick={acceptAll} className="min-h-10 flex-1 btn-glass-field text-[#0a0a0b] border-0 gap-1.5 px-2 text-[13px] sm:px-4 sm:text-sm">
                <Coche className="size-4 shrink-0" />
                Tout accepter
              </Button>
              <Button onClick={refuseAll} className="min-h-10 flex-1 bg-[#ece7de] text-[#0a0a0b] hover:bg-[#f6f2ea] gap-1.5 px-2 text-[13px] sm:px-4 sm:text-sm">
                <Croix className="size-4 shrink-0" />
                Tout refuser
              </Button>
              {/*
                Sur téléphone ce bouton passe SOUS les deux autres plutôt qu'à
                côté : à trois de front, chacun tombait à 95 px de large et les
                intitulés se coupaient. Une première version le réduisait à sa
                seule icône — un bouton sans intitulé, donc sans nom pour un
                lecteur d'écran, et indéchiffrable pour tout le monde.
              */}
              <Button
                variant="outline"
                onClick={showDetails ? saveChoices : () => setShowDetails(true)}
                className={`order-last min-h-10 w-full basis-full gap-1.5 text-[13px] sm:order-none sm:flex sm:text-sm ${showDetails ? "flex" : "hidden"}`}
              >
                {showDetails ? <Coche className="size-4 shrink-0" /> : <Reglages className="size-4 shrink-0" />}
                {showDetails ? "Enregistrer mes choix" : "Personnaliser"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function openCookieSettings() {
  localStorage.removeItem(COOKIE_KEY);
  window.dispatchEvent(new Event("cookie-reset"));
}

export function CookieBannerWrapper() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => setKey((k) => k + 1);
    window.addEventListener("cookie-reset", handler);
    return () => window.removeEventListener("cookie-reset", handler);
  }, []);

  return <CookieBanner key={key} />;
}
