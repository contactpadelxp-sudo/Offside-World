import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lireArticlePublie, lireArticlesPublies } from "@/lib/db/blog";
import { FlecheGauche } from "@/components/icons";

export const revalidate = 600;

/** Pré-génère les articles connus ; les suivants seront rendus à la demande. */
export async function generateStaticParams() {
  const articles = await lireArticlesPublies(100);
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await lireArticlePublie(slug);
  if (!a) return { title: "Article introuvable | Offside Foot Indoor" };
  return {
    title: `${a.titre} | Offside Foot Indoor`,
    description: a.chapo,
    openGraph: {
      title: a.titre,
      description: a.chapo,
      type: "article",
      publishedTime: a.publieLe ?? undefined,
      images: a.image ? [a.image] : undefined,
    },
  };
}

const DATE = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric" });

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await lireArticlePublie(slug);
  if (!a) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <Link
        href="/blog"
        className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-field"
      >
        <FlecheGauche className="size-4" /> Tous les articles
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl">
        {a.titre}
      </h1>
      {a.publieLe && (
        <p className="mt-2 text-sm text-muted-foreground">{DATE.format(new Date(a.publieLe))}</p>
      )}

      {a.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.image} alt="" className="mt-6 w-full rounded-2xl object-cover" />
      )}

      {/*
        Le corps est du HTML écrit dans le back-office. Il a été nettoyé à
        l'enregistrement ET vient de l'être une seconde fois par
        `lireArticlePublie` : l'affichage ne fait pas confiance à la base, au
        cas où un article y entrerait par un autre chemin.
      */}
      <div
        className="prose-article mt-8"
        dangerouslySetInnerHTML={{ __html: a.corps }}
      />
    </article>
  );
}
