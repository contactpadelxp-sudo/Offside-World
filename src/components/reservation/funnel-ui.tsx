"use client";

import { ShieldCheck, CalendarCheck, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* Réassurance affichée dans le funnel (récap / paiement) */
export function TrustRow({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground ${className ?? ""}`}>
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-4 text-field" /> Paiement sécurisé
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarCheck className="size-4 text-field" /> Annulation gratuite jusqu&apos;à 7 jours
      </span>
      <span className="flex items-center gap-1.5">
        <Star className="size-4 fill-yellow-400 text-yellow-400" /> 4.8/5 sur Google
      </span>
    </div>
  );
}

/* Barre sticky affichant le total en temps réel pendant le funnel */
export function SummaryBar({
  visible,
  label,
  detail,
  total,
}: {
  visible: boolean;
  label: string;
  detail?: string;
  total: number;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
        >
          <div className="mx-auto max-w-4xl px-4 pb-3">
            <div className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-field/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{label}</p>
                {detail && <p className="text-xs text-muted-foreground truncate">{detail}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="text-xl font-bold font-[family-name:var(--font-heading)] text-field leading-none">
                  {total}€
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
