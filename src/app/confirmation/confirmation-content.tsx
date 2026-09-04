"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FadeIn, Confetti } from "@/components/motion";
import { lireRecap, type RecapReservation } from "@/lib/reservation";
import { Maison, Plus } from "@/components/icons";
import { motion } from "framer-motion";

const LIBELLES_TYPE: Record<string, string> = {
  anniversaire: "Anniversaire",
  bubble: "Bubble Foot",
  "team-building": "Team Building",
};

function AnimatedCheck() {
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-field/10 to-kick/20 ring-1 ring-field/25">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="26" stroke="#f4b23f" strokeWidth="3" opacity="0.2" />
          <motion.circle
            cx="28" cy="28" r="26"
            stroke="#f4b23f" strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
          <motion.path
            d="M18 28 L25 35 L38 22"
            stroke="#f4b23f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [recap, setRecap] = useState<RecapReservation | null>(null);

  /**
   * Le récapitulatif est relu dans sessionStorage : aucune donnée personnelle
   * ne transite par l'URL, et la référence seule ne permet à personne d'autre
   * d'afficher le détail d'une réservation.
   */
  useEffect(() => {
    setRecap(lireRecap(ref));
  }, [ref]);

  const type = recap?.type ?? "anniversaire";
  const surDevis = recap?.surDevis === true;
  const reference = recap?.ref || ref;

  return (
    <>
      <Confetti />
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
        <div className="text-center">
          <AnimatedCheck />
          <FadeIn delay={0.6}>
            <h1 className="mt-8 text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-foreground">
              {surDevis ? "Demande envoyée !" : "Réservation enregistrée !"}
            </h1>
            {/*
              Honnêteté : rien n'est encore payé ni confirmé automatiquement.
              À revoir le jour où le paiement en ligne et les e-mails
              transactionnels seront branchés.
            */}
            <p className="mt-3 text-muted-foreground text-lg">
              {surDevis
                ? "Merci ! Nous revenons vers vous avec un devis sous 48 heures ouvrables."
                : "Merci ! Nous vous recontactons pour confirmer votre créneau et convenir du règlement."}
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.8}>
          <Card className="mt-10 border-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold">{LIBELLES_TYPE[type] ?? type}</span>
              </div>
              {recap?.formule && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="font-semibold">{recap.formule}</span>
                </div>
              )}
              {recap?.enfant && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enfant fêté</span>
                  <span className="font-semibold">{recap.enfant}</span>
                </div>
              )}
              {recap?.date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold capitalize">{recap.date}</span>
                </div>
              )}
              {recap?.horaire && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horaire</span>
                  <span className="font-semibold">{recap.horaire}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono font-semibold">{reference}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">{surDevis ? "Tarif" : "Montant"}</span>
                <span className="font-bold text-gradient-field">
                  {surDevis ? "Sur devis" : `${recap?.total ?? 0}€`}
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={1}>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Notez votre référence <span className="font-mono font-semibold text-foreground">{reference}</span> :
            elle nous permet de retrouver votre demande.
          </p>
        </FadeIn>

        <FadeIn delay={1.2}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-glass-field inline-flex items-center justify-center gap-2 text-[#0a0a0b] px-6 h-12 rounded-2xl">
              <Maison className="size-4" /> Retour à l&apos;accueil
            </Link>
            <Link href="/reservation" className={cn(buttonVariants({ variant: "outline" }), "gap-2 h-12 rounded-2xl")}>
              <Plus className="size-4" /> Nouvelle réservation
            </Link>
          </div>
        </FadeIn>
      </div>
    </>
  );
}
