import { lireJournal } from "@/lib/db/backoffice";
import { Bouclier } from "@/components/icons";

/**
 * Journal des accès et des modifications.
 *
 * Ce n'est pas un confort d'exploitation. Les réservations contiennent des
 * données d'enfants et de santé : savoir qui a confirmé, annulé ou annoté quoi,
 * et quand, fait partie des mesures attendues d'un responsable de traitement
 * (RGPD art. 5.1.f et 32). Le journal n'est ni modifiable ni effaçable depuis
 * cette page.
 */
export default async function PageJournal() {
  const entrees = await lireJournal();

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Bouclier className="size-6 text-field" /> Journal
      </h1>
      <p className="text-sm text-muted-foreground">
        Les 150 dernières actions du back-office. Consultation seule.
      </p>

      {entrees.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune action enregistrée pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Quand</th>
                <th className="px-4 py-3 font-semibold">Qui</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Cible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entrees.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {e.quand}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{e.acteur}</td>
                  <td className="px-4 py-3">{e.action}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {e.cible ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
