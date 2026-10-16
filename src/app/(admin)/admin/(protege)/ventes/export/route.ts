import { type NextRequest } from "next/server";
import { journaliser, sessionCourante } from "@/lib/admin/session";
import { baseConfiguree } from "@/lib/supabase/server";
import { lireRapportVentes } from "@/lib/db/ventes";
import { MigrationVentesManquante } from "@/lib/db/migration-ventes";
import { lirePeriodeVentes } from "@/lib/periode-ventes";
import { rapportEnCsv } from "@/lib/ventes-csv";
import { rapportEnExcel } from "@/lib/ventes-excel";
import { heure, jourISO } from "@/lib/temps";
import { jourLong } from "@/lib/ventes";

/**
 * Le récapitulatif des ventes, en fichier : Excel pour le lire, CSV pour
 * l'importer.
 *
 * LA SESSION EST REVÉRIFIÉE ICI, comme pour l'aperçu du devis. Le proxy couvre
 * `/admin`, mais ce fichier porte le chiffre d'affaires du complexe : sa
 * protection ne doit pas dépendre d'un `matcher` qu'une modification pourrait
 * élargir ou rétrécir sans bruit.
 *
 * EN GET, ET C'EST SANS RISQUE ICI. L'adresse ne porte que deux dates et un
 * format — rien de personnel —, et c'est ce qui permet un simple lien de
 * téléchargement, que le navigateur sait reprendre et enregistrer.
 *
 * CHAQUE EXPORT EST JOURNALISÉ : quelle période, quel format, par qui. Un
 * chiffre d'affaires qui sort du site doit laisser une trace.
 */
export async function GET(requete: NextRequest) {
  const session = await sessionCourante();
  if (!session) return new Response(null, { status: 404 });
  if (!baseConfiguree()) return new Response("Base indisponible", { status: 503 });

  const p = requete.nextUrl.searchParams;
  const maintenant = new Date();
  const { du, au } = lirePeriodeVentes(
    { du: p.get("du") ?? undefined, au: p.get("au") ?? undefined, periode: p.get("periode") ?? undefined },
    jourISO(maintenant)
  );
  const format = p.get("format") === "csv" ? "csv" : "xlsx";

  let rapport;
  try {
    rapport = await lireRapportVentes(du, au);
  } catch (e) {
    if (e instanceof MigrationVentesManquante) {
      return new Response(
        "Le récapitulatif des ventes n'est pas encore disponible : la mise à jour de la base de données n'a pas été appliquée.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
      );
    }
    throw e;
  }
  await journaliser(session, "ventes.export", null, {
    du,
    au,
    format,
    ventes: rapport.nombreVentes,
  });

  const nom = `Ventes en ligne Offside ${du} au ${au}`;
  const nomAscii = `ventes-en-ligne-offside-${du}-au-${au}`;
  const entetes = (type: string, extension: string) => ({
    "Content-Type": type,
    // Deux noms : l'un en ASCII pour les navigateurs anciens, l'autre encodé
    // (RFC 6266) pour que les accents survivent partout ailleurs.
    "Content-Disposition": `attachment; filename="${nomAscii}.${extension}"; filename*=UTF-8''${encodeURIComponent(`${nom}.${extension}`)}`,
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });

  if (format === "csv") {
    return new Response(rapportEnCsv(rapport), {
      headers: entetes("text/csv; charset=utf-8", "csv"),
    });
  }

  // Avec l'année : « jeudi 16 octobre » ne date rien dans une comptabilité.
  const genereLe = `${jourLong(jourISO(maintenant))} à ${heure(maintenant)}`;
  const fichier = await rapportEnExcel(rapport, genereLe);
  return new Response(fichier as BodyInit, {
    headers: entetes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
  });
}
