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
 */

function Barre({ className = "" }: { className?: string }) {
  return <span className={`block rounded bg-white/10 ${className}`} />;
}

export function SqueletteEnTete() {
  return (
    <div className="animate-pulse">
      <Barre className="h-8 w-64" />
      <Barre className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-5 flex gap-2">
        <Barre className="h-8 w-24 rounded-lg" />
        <Barre className="h-8 w-28 rounded-lg" />
        <Barre className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SqueletteCartes({ nombre = 3 }: { nombre?: number }) {
  return (
    <div className="mt-6 animate-pulse space-y-4">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Barre className="h-5 w-24 rounded-md" />
                <Barre className="h-5 w-20 rounded-md" />
              </div>
              <Barre className="mt-3 h-5 w-48" />
              <Barre className="mt-2 h-4 w-64 max-w-full" />
            </div>
            <div className="w-32 space-y-2">
              <Barre className="ml-auto h-6 w-16" />
              <Barre className="ml-auto h-4 w-28" />
            </div>
          </div>
          <Barre className="mt-4 h-14 w-full rounded-xl" />
          <Barre className="mt-4 h-8 w-56 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SqueletteLignes({ nombre = 6 }: { nombre?: number }) {
  return (
    <div className="mt-6 animate-pulse divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Barre className="h-4 w-28" />
          <Barre className="h-4 w-40" />
          <Barre className="h-4 w-24" />
          <Barre className="ml-auto h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
