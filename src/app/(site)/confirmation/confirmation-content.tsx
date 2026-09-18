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
import { euros } from "@/lib/tarification";
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
  /*
    Stripe renvoie le client ici avec `paiement=ok` après un paiement accepté
    (voir `success_url` dans `lib/paiement/session.ts`).

    Ce paramètre sert à ADAPTER LE MESSAGE, jamais à confirmer quoi que ce
    soit : c'est le webhook qui fait foi. Quelqu'un qui ajouterait
    `?paiement=ok` à la main verrait un autre texte, et rien de plus — sa
    réservation resterait en attente.
  */
  const paye = params.get("paiement") === "ok";
  const ref = params.get("ref") || "";
  const [recap, setRecap] = useState<RecapReservation | null>(null);
  const [recapRelu, setRecapRelu] = useState(false);
  /**
   * Le récapitulatif est relu dans sessionStorage : aucune donnée personnelle
   * ne transite par l'URL, et la référence seule ne permet à personne d'autre
   * d'afficher le détail d'une réservation.
   */
  useEffect(() => {
    setRecap(lireRecap(ref));
    setRecapRelu(true);
  }, [ref]);
  /*
    DEUX ABSENCES À NE PAS CONFONDRE : « pas encore relu » (premier rendu, avant
    l'effet) et « introuvable » (lien ouvert sur un autre appareil, stockage
    vidé). Sans ce drapeau, la page annoncerait qu'elle ne sait rien avant même
    d'avoir cherché.
  */
  const detailIntrouvable = recapRelu && recap === null;
  const surDevis = recap?.surDevis === true;
  const reference = recap?.ref || ref;
  return (
    <>
      <Confetti />
      <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 md:pt-36 md:pb-20">
        <div className="text-center">
          <AnimatedCheck />
          <FadeIn delay={0.6}>
            <h1 className="mt-8 text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-foreground">
              {/*
                LE TITRE NE DÉPEND PLUS DE `recap`, ET C'EST VOULU.

                `recap` est relu APRÈS le premier rendu : le faire entrer dans le
                titre faisait lire « Demande bien reçue ! » puis basculer en
                « Réservation enregistrée ! » sous les yeux du client, sur le
                parcours le plus courant.

                Ce qu'on sait avec certitude vient de l'URL — devis ou non, payé ou
                non. Le titre s'y tient ; le détail, lui, attend d'avoir été relu.
              */}
              {surDevis ? "Demande envoyée !" : paye ? "C’est réservé !" : "Demande bien reçue !"}
            </h1>
            {/*
              TROIS SITUATIONS, TROIS MESSAGES. Cette page annonçait
              « nous vous recontactons pour convenir du règlement » à TOUT LE
              MONDE — y compris au client qui venait de payer sur Stripe et
              arrivait ici avec paiement=ok. Lui dire qu’il reste à payer
              l’expose à payer deux fois, et c’est une information trompeuse
              sur le prix.

              Comme le titre, ce texte ne dépend que de l’URL. Une quatrième
              branche le faisait varier selon que le récapitulatif avait été
              relu ou non, alors que les deux formulations disaient la même
              chose : le client voyait la phrase changer sous ses yeux sans
              rien apprendre de plus.
            */}
            <p className="mt-3 text-muted-foreground text-lg">
              {surDevis
                ? "Merci ! Nous revenons vers vous avec un devis sous 48 heures ouvrables."
                : paye
                  ? "Votre paiement est accepté et votre créneau est réservé. Vous recevez la confirmation par e-mail."
                  : "Merci ! Nous vous recontactons très vite pour confirmer votre créneau et convenir du règlement."}
            </p>
          </FadeIn>
        </div>
        <FadeIn delay={0.8}>
          <Card className="mt-10 border-2">
            <CardContent className="p-6 space-y-3">
              {/*
                RIEN N’EST INVENTÉ ICI. Le type retombait sur « anniversaire » et
                le montant sur « 0 € » dès que le récapitulatif manquait — lien de
                confirmation ouvert sur un autre appareil, stockage vidé. La page
                affichait alors une réservation qui n’existait pas, au mauvais
                prix. Seule la référence vient de l’URL : elle seule est sûre.
              */}
              {recap && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-semibold">{LIBELLES_TYPE[recap.type] ?? recap.type}</span>
                  </div>
                  {recap.formule && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formule</span>
                      <span className="font-semibold">{recap.formule}</span>
                    </div>
                  )}
                  {recap.enfant && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enfant fêté</span>
                      <span className="font-semibold">{recap.enfant}</span>
                    </div>
                  )}
                  {recap.date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-semibold">{recap.date}</span>
                    </div>
                  )}
                  {recap.horaire && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horaire</span>
                      <span className="font-semibold">{recap.horaire}</span>
                    </div>
                  )}
                </>
              )}
              {reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Référence</span>
                  <span className="font-mono font-semibold">{reference}</span>
                </div>
              )}
              {recap && (
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">{surDevis ? "Tarif" : "Montant TVAC"}</span>
                  <span className="font-bold text-gradient-field">
                    {surDevis ? "Sur devis" : euros(recap.total)}
                  </span>
                </div>
              )}
              {detailIntrouvable && (
                <p className="text-sm text-muted-foreground">
                  {reference
                    ? "Le détail — formule, date, montant — n’est gardé que dans le navigateur qui a servi à remplir la demande : il ne peut pas s’afficher ici. Votre référence suffit à la retrouver."
                    : "Ce lien ne porte aucune référence : nous ne pouvons rien afficher de votre demande. Elle figure dans l’e-mail reçu au moment de l’envoi, dont l’objet commence par « Votre demande »."}
                </p>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        {reference && (
          <FadeIn delay={1}>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Notez votre référence <span className="font-mono font-semibold text-foreground">{reference}</span> :
              elle nous permet de retrouver votre demande.
            </p>
          </FadeIn>
        )}
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