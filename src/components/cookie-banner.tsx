"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Coche, Cookie, Croix, Reglages } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
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
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Ré-affiche si aucun consentement OU s'il a expiré
    if (isConsentValid(getStoredConsent())) return;
    const t = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(t);
  }, []);

  const save = useCallback(
    (consent: CookieConsent) => {
      storeConsent(consent);
      setVisible(false);
    },
    []
  );

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const refuseAll = () => save({ necessary: true, analytics: false, marketing: false });
  const saveChoices = () => save({ necessary: true, analytics, marketing });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card/95 backdrop-blur-xl p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kick/10 text-kick">
                <Cookie className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Ce site utilise des cookies</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez
                  accepter, refuser ou personnaliser vos choix.{" "}
                  <a href="/politique-cookies" className="underline hover:text-primary transition-colors">
                    En savoir plus
                  </a>
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="font-medium">Marketing</span>
                      <span className="text-muted-foreground">(publicité ciblée)</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {/* Refuser et Accepter ont volontairement le même poids visuel (conformité RGPD/CNIL) */}
              <Button onClick={acceptAll} className="flex-1 btn-glass-field text-[#0a0a0b] border-0 gap-1.5">
                <Coche className="size-4" />
                Tout accepter
              </Button>
              <Button onClick={refuseAll} className="flex-1 bg-[#ece7de] text-[#0a0a0b] hover:bg-[#f6f2ea] gap-1.5">
                <Croix className="size-4" />
                Tout refuser
              </Button>
              {!showDetails ? (
                <Button variant="outline" onClick={() => setShowDetails(true)} className="gap-1.5 sm:basis-full sm:flex-none">
                  <Reglages className="size-4" />
                  Personnaliser
                </Button>
              ) : (
                <Button variant="outline" onClick={saveChoices} className="gap-1.5 sm:basis-full sm:flex-none">
                  <Coche className="size-4" />
                  Enregistrer mes choix
                </Button>
              )}
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
