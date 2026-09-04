import { redirect } from "next/navigation";
import { backOfficeConfigure, sessionCourante } from "@/lib/admin/session";
import { FormulaireConnexion } from "./formulaire";
import { NOM_COMMERCIAL } from "@/data/entreprise";
import { Cadenas } from "@/components/icons";

/** Jamais de cache : la page dépend de la session en cours. */
export const dynamic = "force-dynamic";

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  if (!backOfficeConfigure()) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-xl font-bold">Back-office indisponible</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Les identifiants d&apos;administration ou la base de données ne sont pas configurés sur
          cet environnement.
        </p>
      </main>
    );
  }

  // Déjà connecté : inutile de redemander.
  if (await sessionCourante()) redirect("/admin");

  const { suite } = await searchParams;
  const cible = suite?.startsWith("/admin/") && !suite.startsWith("//") ? suite : "/admin";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-field/15 text-field">
            <Cadenas className="size-5" />
          </span>
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-lg font-bold leading-tight">
              Back-office
            </h1>
            <p className="text-xs text-muted-foreground">{NOM_COMMERCIAL}</p>
          </div>
        </div>

        <FormulaireConnexion suite={cible} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Espace réservé au personnel du complexe.
      </p>
    </main>
  );
}
