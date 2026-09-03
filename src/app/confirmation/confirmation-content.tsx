"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FadeIn, Confetti } from "@/components/motion";
import { loadReservation, type ReservationSummary } from "@/lib/reservation";
import { Home, Plus, Mail, QrCode, Lightbulb, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const typeLabels: Record<string, string> = {
  anniversaire: "Anniversaire",
  libre: "Entrée libre",
  foot: "Location de terrain",
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
  const [data, setData] = useState<ReservationSummary | null>(null);

  // Le récap est lu côté client depuis sessionStorage (aucune donnée perso dans l'URL)
  useEffect(() => {
    setData(loadReservation(ref));
  }, [ref]);

  const type = data?.type || "anniversaire";
  const total = String(data?.total ?? 0);
  const formule = data?.formule ?? null;
  const enfant = data?.enfant ?? null;
  const reference = data?.ref || ref || "OW-XXXXXX";
  const isFoot = type === "foot";

  return (
    <>
      <Confetti />
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
        {/* Animated check */}
        <div className="text-center">
          <AnimatedCheck />
          <FadeIn delay={0.6}>
            <h1 className="mt-8 text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-foreground">
              Réservation confirmée !
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Merci pour votre réservation. Un email de confirmation vous a été envoyé (simulé).
            </p>
          </FadeIn>
        </div>

        {/* Recap */}
        <FadeIn delay={0.8}>
          <Card className="mt-10 border-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold">{typeLabels[type] ?? type}</span>
              </div>
              {formule && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="font-semibold">{formule}</span>
                </div>
              )}
              {enfant && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enfant fêté</span>
                  <span className="font-semibold">{enfant}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono font-semibold">{reference}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">Total payé</span>
                <span className="font-bold text-gradient-field">{total}€</span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Mock email for foot */}
        {isFoot && (
          <FadeIn delay={1}>
            <Card className="mt-6 border-dashed border-2">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)]">
                  <Mail className="size-5 text-field" /> Aperçu de l&apos;email (simulé)
                </h2>
                <div className="rounded-2xl bg-muted p-5 space-y-3 text-sm">
                  <p><strong>Objet :</strong> Votre réservation Offside World — Confirmation</p>
                  <p>Bonjour, votre terrain est réservé ! Présentez le QR code ci-dessous.</p>
                  <div className="flex justify-center py-4">
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-field bg-white/5">
                      <div className="text-center">
                        <QrCode className="size-12 text-field mx-auto" />
                        <p className="text-xs text-muted-foreground mt-1">QR Code<br />(simulé)</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-field/10 p-4 text-sm">
                    <p className="font-semibold text-field flex items-center gap-1.5">
                      <Lightbulb className="size-4" /> Consignes :
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {["Lumières allumées automatiquement", "Ballon fourni à l'accueil", "Vestiaires et chasubles à disposition", "Arrivez 10 min avant"].map((c) => (
                        <li key={c} className="flex items-center gap-1.5"><ArrowRight className="size-3 shrink-0" /> {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Actions */}
        <FadeIn delay={1.2}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-glass-field inline-flex items-center justify-center gap-2 text-[#0a0a0b] px-6 h-12 rounded-2xl">
              <Home className="size-4" /> Retour à l&apos;accueil
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
