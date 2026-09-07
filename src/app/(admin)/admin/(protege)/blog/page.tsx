import Link from "next/link";
import { lireTousLesArticles } from "@/lib/db/blog";
import { BoutonNouvelArticle } from "@/components/admin/bouton-nouvel-article";
import { Plume } from "@/components/icons";

/**
 * Liste des articles.
 *
 * Les brouillons sont EN HAUT : ce sont eux qui attendent quelque chose. Une
 * liste triée par date mettrait en tête les articles déjà publiés, c'est-à-dire
 * ceux sur lesquels il n'y a rien à faire.
 */

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function PageBlog() {
  const articles = await lireTousLesArticles();
  const brouillons = articles.filter((a) => !a.publie).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
          <Plume className="size-6 text-field" /> Blog
        </h1>
        <BoutonNouvelArticle />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {articles.length === 0
          ? "Aucun article pour l’instant."
          : `${articles.length} article${articles.length > 1 ? "s" : ""}${
              brouillons > 0 ? `, dont ${brouillons} en brouillon` : ""
            }.`}
      </p>

      {articles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="font-medium">Rien n’est encore écrit.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            « Nouvel article » crée un brouillon vide et l’ouvre : personne ne le voit tant que la
            case « Visible sur le site » n’est pas cochée.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/blog/${a.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-field/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                      a.publie ? "bg-field/15 text-field" : "bg-white/10 text-foreground"
                    }`}
                  >
                    {a.publie ? "En ligne" : "Brouillon"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">/{a.slug}</span>
                </div>

                <h2 className="mt-2 font-bold">{a.titre}</h2>
                {a.chapo && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.chapo}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.publie && a.publieLe
                    ? `Publié le ${DATE.format(new Date(a.publieLe))}`
                    : `Modifié le ${DATE.format(new Date(a.modifieLe))}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
