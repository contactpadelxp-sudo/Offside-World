import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, verifier } from "@/lib/admin/jeton";

/**
 * Barrière d'entrée du back-office.
 *
 * `/admin` affiche et modifie des réservations : noms, téléphones, prénoms et
 * âges d'enfants, allergies. Le proxy s'exécute AVANT le rendu et avant la
 * résolution de la route — donc avant qu'une éventuelle version en cache ne
 * puisse être servie.
 *
 * CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS
 *
 * Il redirige tôt, il n'autorise pas. Il se contente de vérifier que le cookie
 * porte une signature émise par ce serveur : c'est un contrôle sans accès à la
 * base, donc rapide, mais qui ne sait rien d'une session expirée ou révoquée.
 * La vraie décision est prise dans `(admin)/admin/(protege)/layout.tsx` et
 * redite dans chaque Server Action. La documentation de Next insiste sur ce
 * point, et pour une bonne raison : un changement de `matcher` ou un
 * déplacement de fichier peut retirer silencieusement la couverture du proxy.
 *
 * FERMÉ PAR DÉFAUT : sans ADMIN_USER ni ADMIN_PASSWORD dans l'environnement,
 * tout /admin répond 404. Une variable oubliée ne peut donc pas ouvrir l'accès.
 * 404 et non 403, pour ne pas confirmer l'existence du back-office.
 */

const CONNEXION = "/admin/connexion";

/** Jamais de cache, jamais d'indexation. */
const PRIVE = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function avecEntetes(reponse: NextResponse): NextResponse {
  for (const [cle, valeur] of Object.entries(PRIVE)) reponse.headers.set(cle, valeur);
  return reponse;
}

export async function proxy(request: NextRequest) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return avecEntetes(new NextResponse(null, { status: 404 }));
  }

  const chemin = request.nextUrl.pathname;

  // La page de connexion doit rester atteignable sans session, sinon on ne
  // pourrait jamais en ouvrir une.
  if (chemin === CONNEXION) return avecEntetes(NextResponse.next());

  const id = await verifier(request.cookies.get(COOKIE_SESSION)?.value);
  if (id) return avecEntetes(NextResponse.next());

  const cible = new URL(CONNEXION, request.url);
  // On ne réinjecte que des chemins internes au back-office : un paramètre
  // `suite` venu de l'extérieur ne peut pas servir de redirection ouverte.
  if (chemin.startsWith("/admin/") && chemin !== CONNEXION) {
    cible.searchParams.set("suite", chemin);
  }
  return avecEntetes(NextResponse.redirect(cible));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
