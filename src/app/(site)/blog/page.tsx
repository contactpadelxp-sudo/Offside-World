import type { Metadata } from "next";
import Link from "next/link";
import { lireArticlesPublies } from "@/lib/db/blog";

export const metadata: Metadata = {
  title: "Blog | Offside Foot Indoor",
  description: "Actualités, conseils et coulisses du complexe de foot indoor de Gembloux.",
};

// Les articles viennent de la base : la page se régénère au plus tard toutes
// les dix minutes, sans redéploiement. Publier reste donc une case à cocher.
export const revalidate = 600;

const DATE = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric" });

export default async function PageBlog() {
  const articles = await lireArticlesPublies();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl">
        Le blog
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ce qui se passe au complexe : nouveautés, conseils pour organiser une fête, coulisses.
      </p>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Le premier article arrive bientôt.
        </p>
      ) : (
        <ul className="mt-10 space-y-5">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/blog/${a.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-field/40"
              >
                <div className="flex flex-col sm:flex-row">
                  {a.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.image}
                      alt=""
                      className="h-44 w-full object-cover sm:h-auto sm:w-56 sm:shrink-0"
                    />
                  )}
                  <div className="p-5">
                    {a.publieLe && (
                      <p className="text-xs text-muted-foreground">
                        {DATE.format(new Date(a.publieLe))}
                      </p>
                    )}
                    <h2 className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold group-hover:text-field">
                      {a.titre}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{a.chapo}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
