import { sessionCourante } from "@/lib/admin/session";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { genererDevisPdf } from "@/lib/devis-pdf";
import { lignesDepuisJson } from "@/lib/devis";
import { jourLisibleCap } from "@/lib/temps";

/**
 * Aperçu du devis, avant de l'envoyer.
 *
 * CE QU'ON MONTRE EST LE DOCUMENT LUI-MÊME. Cette route appelle exactement la
 * même fonction que l'envoi : ce que l'exploitant voit ici est, au pixel près,
 * ce que le client recevra — mise en page, arrondis, mentions comprises. Un
 * aperçu reconstitué en HTML aurait pu diverger du PDF réel, et n'aurait alors
 * servi qu'à rassurer à tort.
 *
 * EN POST, ET NON EN GET. Les montants affichés sont ceux en cours de saisie :
 * ils ne sont pas encore en base. Les passer par l'URL les inscrirait dans
 * l'historique du navigateur et dans les journaux du serveur — des prix
 * commerciaux, pour un client nommé.
 *
 * LA SESSION EST REVÉRIFIÉE ICI. Le proxy couvre `/admin`, mais cette
 * vérification ne doit pas dépendre de sa configuration : un changement de
 * `matcher` retirerait la protection en silence, et cette route rend un
 * document nominatif portant des prix.
 */
export async function POST(requete: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await sessionCourante();
  if (!session) return new Response(null, { status: 404 });
  if (!baseConfiguree()) return new Response("Base indisponible", { status: 503 });

  const { id } = await ctx.params;

  const formulaire = await requete.formData();
  const brut = formulaire.get("devis");
  if (typeof brut !== "string") return new Response("Devis absent", { status: 400 });

  let saisie: Record<string, unknown>;
  try {
    saisie = JSON.parse(brut);
  } catch {
    return new Response("Devis illisible", { status: 400 });
  }

  // La demande est relue en base : le nom du client et sa référence ne sont
  // jamais pris dans ce que le navigateur a envoyé.
  const { data } = await base()
    .from("demandes_devis")
    .select("reference, entreprise, contact_nom, contact_email")
    .eq("id", id)
    .maybeSingle();

  if (!data) return new Response("Demande introuvable", { status: 404 });

  const validite = typeof saisie.validite === "string" ? saisie.validite : "";
  const tva = saisie.tvaPourcent;

  const pdf = await genererDevisPdf({
    reference: data.reference,
    emisLe: jourLisibleCap(new Date()),
    validiteLisible: /^\d{4}-\d{2}-\d{2}$/.test(validite)
      ? jourLisibleCap(new Date(`${validite}T12:00:00Z`))
      : "— à compléter —",
    client: {
      entreprise: data.entreprise,
      contactNom: data.contact_nom,
      contactEmail: data.contact_email,
      adresse: typeof saisie.clientAdresse === "string" ? saisie.clientAdresse : "",
      tva: typeof saisie.clientTva === "string" ? saisie.clientTva : "",
    },
    lignes: lignesDepuisJson(saisie.lignes).slice(0, 30),
    tvaPourcent: typeof tva === "number" && Number.isFinite(tva) ? tva : null,
    motDIntroduction: typeof saisie.message === "string" ? saisie.message : "",
  });

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      // `inline` : le PDF s'ouvre dans l'onglet plutôt que de se télécharger.
      "Content-Disposition": `inline; filename="Apercu ${data.reference}.pdf"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
