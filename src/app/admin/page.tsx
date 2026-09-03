import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockReservations } from "@/data/backoffice";
import type { Metadata } from "next";
import { Cake, CircleDot, Trophy, Building2, ClipboardList, AlertTriangle, Phone, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Back-office — Résumé du jour | Offside World",
  description: "Vue d'ensemble des réservations du lendemain.",
  robots: { index: false, follow: false, nocache: true },
};

const typeBadge: Record<string, { label: string; className: string; icon: typeof Cake }> = {
  anniversaire: { label: "Anniversaire", className: "bg-kick/10 text-kick border-kick/30", icon: Cake },
  libre: { label: "Entrée libre", className: "bg-field/10 text-field border-field/30", icon: CircleDot },
  foot: { label: "Foot", className: "bg-primary/10 text-primary border-primary/30", icon: Trophy },
  "team-building": { label: "Team Building", className: "bg-white/10 text-foreground border-white/20", icon: Building2 },
};

export default function AdminPage() {
  const totalRevenue = mockReservations.reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 md:pt-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
            <ClipboardList className="size-7 text-field" /> Résumé du jour
          </h1>
          <p className="text-muted-foreground">
            Réservations pour demain — <strong>mardi 10 juin 2026</strong>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires prévu</p>
          <p className="text-2xl font-bold text-field">{totalRevenue}€</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(["anniversaire", "foot", "libre", "team-building"] as const).map((type) => {
          const count = mockReservations.filter((r) => r.type === type).length;
          const badge = typeBadge[type];
          const Icon = badge.icon;
          return (
            <Card key={type}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge variant="outline" className={`${badge.className} gap-1`}>
                  <Icon className="size-3" />
                  {badge.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reservation list */}
      <div className="mt-8 space-y-4">
        {mockReservations.map((res) => {
          const badge = typeBadge[res.type];
          const Icon = badge.icon;
          return (
            <Card key={res.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${badge.className} gap-1`}>
                        <Icon className="size-3" />
                        {badge.label}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">{res.id}</span>
                    </div>
                    <h3 className="mt-2 font-bold">{res.clientName}</h3>
                    <p className="text-sm text-muted-foreground">{res.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-field">{res.totalPrice}€</p>
                    <p className="text-sm font-medium">{res.timeSlot}</p>
                    {res.salle && (
                      <p className="text-xs text-muted-foreground">{res.salle}</p>
                    )}
                  </div>
                </div>

                {/* Prep details */}
                <div className="mt-4 rounded-xl bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Package className="size-3.5" /> À préparer
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span>{res.clientPhone}</span>
                    </div>
                    {res.options.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Options : </span>
                        <span>{res.options.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  {res.notes && (
                    <p className="mt-2 text-sm text-kick font-medium flex items-center gap-1.5">
                      <AlertTriangle className="size-4 shrink-0" /> {res.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/*
        BACK-END FUTUR — Bonnes pratiques sécurité :
        - Authentification requise pour accéder au back-office (contrôle d'accès)
        - Chiffrement des données sensibles (emails, téléphones) en base
        - Journalisation des accès et modifications (audit log)
        - Rate limiting sur les endpoints API
        - HTTPS obligatoire (déjà le cas sur Vercel)
        - Validation et assainissement de toutes les entrées côté serveur
      */}
    </div>
  );
}
