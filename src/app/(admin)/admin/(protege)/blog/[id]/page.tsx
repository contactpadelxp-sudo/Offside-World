import { notFound } from "next/navigation";
import { lireArticle } from "@/lib/db/blog";
import { FormulaireArticle } from "@/components/admin/formulaire-article";

export const dynamic = "force-dynamic";

export default async function PageArticle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await lireArticle(id);
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-5 font-[family-name:var(--font-heading)] text-2xl font-bold">
        {article.publie ? "Modifier l’article" : "Brouillon"}
      </h1>
      <FormulaireArticle a={article} />
    </div>
  );
}
