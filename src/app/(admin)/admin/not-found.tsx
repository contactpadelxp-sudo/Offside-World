import Link from "next/link";

/**
 * Écran « introuvable » DU BACK-OFFICE.
 *
 * POURQUOI IL EXISTE SÉPARÉMENT.
 *
 * Le 404 vit à la racine de `app/`, seul endroit qui attrape les adresses ne
 * correspondant à aucune route. Mais la racine attrape AUSSI les `notFound()`
 * levés dans le back-office — par exemple un article de blog inexistant ouvert
 * depuis `/admin/blog/…`. Or ce 404 racine monte l'en-tête et le pied de page
 * du site public : un exploitant connecté se retrouvait avec « Accueil »,
 * « Anniversaires », « Réserver » au milieu de son outil de travail.
 *
 * C'est exactement l'étanchéité que posent `(admin)/layout.tsx` et la barre du
 * back-office, qui ne contient volontairement aucun lien vers la vitrine : on
 * n'y entre pas par mégarde, on n'en sort pas par mégarde.
 *
 * Cet écran-ci reste donc nu. La barre du back-office est rendue par le gabarit
 * protégé au-dessus quand la session existe, et rien d'autre ne doit s'ajouter.
 */
export default function Introuvable() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold">
        Cette page du back-office n&apos;existe pas
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        L&apos;adresse est peut-être erronée, ou l&apos;élément a été supprimé depuis.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-field px-4 text-sm font-semibold text-[#0a0a0b] transition-colors hover:bg-field-dark"
      >
        Retour aux réservations
      </Link>
    </main>
  );
}
