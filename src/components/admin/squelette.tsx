/**
 * Ossatures affichées pendant le chargement d'une page du back-office.
 *
 * Toutes ces pages interrogent la base à chaque visite : sans ossature, un clic
 * laisserait l'écran figé sur la page précédente jusqu'à la réponse du serveur.
 * Avec elle, la barre de navigation reste en place et utilisable, et le contenu
 * se remplit quand il arrive.
 *
 * Les blocs reprennent la taille réelle du contenu qu'ils remplacent : la page
 * ne saute pas au moment où les vraies données prennent leur place.
 *
 * DES LARGEURS RELATIVES, PAS DES LARGEURS EN PIXELS.
 *
 * C'est la correction de fond de ce fichier. Les blocs étaient dimensionnés en
 * dur — `w-64`, `w-96`, `w-48`, `w-32` — c'est-à-dire aux largeurs qu'ils
 * occupent sur un écran d'ordinateur. Mesurée sur un téléphone de 375 px, la
 * carte d'ossature réclamait 400 px pour 303 px disponibles : la page entière
 * passait à 421 px de large et se mettait à défiler à l'horizontale. Comme
 * l'ossature s'affiche à CHAQUE navigation du back-office, ce décalage
 * apparaissait à chaque clic, puis disparaissait quand les vraies données
 * arrivaient — un tremblement dont on n'aurait jamais trouvé la cause.
 *
 * Les largeurs sont donc en pourcentage, avec un plafond en pixels
 * (`w-2/3 max-w-64`) : le plafond garde l'allure voulue sur grand écran, le
 * pourcentage laisse le bloc rétrécir sur petit. Et la carte se replie comme la
 * vraie fiche qu'elle remplace, qui passe elle aussi en une colonne sous `sm:`.
 */

function Barre({ className = "" }: { className?: string }) {
  return <span className={`block rounded bg-white/10 ${className}`} />;
}

export function SqueletteEnTete({ onglets = 3 }: { onglets?: number }) {
  return (
    <div className="animate-pulse">
      <Barre className="h-8 w-2/3 max-w-64" />
      <Barre className="mt-2 h-4 w-full max-w-96" />
      {/* Les onglets de filtre se replient comme les vrais. */}
      {onglets > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: onglets }, (_, i) => (
            <Barre key={i} className={`h-8 rounded-lg ${i % 2 ? "w-28" : "w-24"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/*
  CHAQUE PAGE ANNONCE SA PROPRE FORME.

  `loading.tsx` couvre aussi les pages filles qui n'en ont pas. Trois pages
  vivaient donc sur l'ossature des RÉSERVATIONS : l'analyse, le blog et
  l'écriture d'un article. On y voyait trois grandes fiches et trois onglets de
  filtre, puis tout était remplacé par autre chose.

  Le pire cas était l'analyse, parce que c'est la page la plus lente — elle
  rapatrie jusqu'à 50 000 lignes de mesure — donc celle où la fausse ossature
  reste le plus longtemps à l'écran avant de sauter.
*/

/** Grille de grands chiffres, comme en tête de l'analyse. */
export function SqueletteTuiles({ nombre = 4 }: { nombre?: number }) {
  return (
    <div className="mt-6 grid animate-pulse grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <Barre className="h-9 w-3/5 max-w-24" />
          <Barre className="mt-2 h-4 w-4/5 max-w-32" />
        </div>
      ))}
    </div>
  );
}

/** Carte au contenu haut : un graphique, un tunnel, un éditeur. */
export function SqueletteBloc({ hauteur = "h-32" }: { hauteur?: string }) {
  return (
    <div className="mt-6 animate-pulse rounded-2xl border border-border bg-card p-5">
      <Barre className="h-5 w-2/5 max-w-48" />
      <Barre className="mt-2 h-4 w-4/5 max-w-96" />
      <Barre className={`mt-4 w-full rounded-xl ${hauteur}`} />
    </div>
  );
}

export function SqueletteCartes({ nombre = 3 }: { nombre?: number }) {
  return (
    <div className="mt-6 animate-pulse space-y-4">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          {/*
            `flex-wrap` et `sm:flex-nowrap` : la fiche de réservation qu'on
            remplace place le montant et la date sous le nom du client sur
            téléphone, et à droite à partir de `sm:`. L'ossature suit, sinon
            elle annonce une mise en page que le contenu ne tiendra pas.
          */}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-3 sm:flex-nowrap">
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <div className="flex flex-wrap gap-2">
                <Barre className="h-5 w-24 rounded-md" />
                <Barre className="h-5 w-20 rounded-md" />
              </div>
              <Barre className="mt-3 h-5 w-3/5 max-w-48" />
              <Barre className="mt-2 h-4 w-4/5 max-w-64" />
            </div>
            <div className="w-full space-y-2 sm:w-32">
              <Barre className="h-6 w-16 sm:ml-auto" />
              <Barre className="h-4 w-28 sm:ml-auto" />
            </div>
          </div>
          <Barre className="mt-4 h-14 w-full rounded-xl" />
          <Barre className="mt-4 h-8 w-full max-w-56 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SqueletteLignes({ nombre = 6 }: { nombre?: number }) {
  return (
    <div className="mt-6 animate-pulse divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: nombre }, (_, i) => (
        /*
          Ces largeurs-là ne débordaient pas de la PAGE — le conteneur les
          écrête —, mais elles réclamaient 544 px pour 343 : les trois derniers
          blocs étaient simplement coupés au bord de la carte, et le dernier,
          poussé à droite par `ml-auto`, n'apparaissait pas du tout. En
          pourcentage, la ligne garde ses quatre blocs visibles à toute largeur.
        */
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Barre className="h-4 w-1/4 max-w-28 shrink-0" />
          <Barre className="h-4 w-2/5 max-w-40 shrink" />
          <Barre className="ml-auto h-8 w-1/5 max-w-24 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
