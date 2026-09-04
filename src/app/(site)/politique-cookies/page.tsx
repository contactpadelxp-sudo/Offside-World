import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique cookies | Offside Foot Indoor",
  description: "Politique d'utilisation des cookies sur Offside Foot Indoor.",
};

/*
  Décrites une seule fois : le tableau (à partir de `sm:`) et la liste
  (téléphone) sont deux rendus de ces mêmes lignes. Sur 375 px, les quatre
  colonnes débordaient et « Consentement » — la réponse juridique que la page
  existe pour donner — tombait hors de l'écran, dans un conteneur qui défilait
  sans le dire.
*/
const CATEGORIES: { categorie: string; finalite: string; duree: string; consentement: string }[] = [
  {
    categorie: "Nécessaires",
    finalite: "Fonctionnement du site, mémorisation du consentement cookies, sécurité",
    duree: "Session / 12 mois",
    consentement: "Non requis (intérêt légitime)",
  },
  {
    categorie: "Mesure d'audience",
    finalite:
      "Statistiques anonymes de fréquentation [À COMPLÉTER — ex. : Google Analytics, Plausible]",
    duree: "[À COMPLÉTER]",
    consentement: "Requis",
  },
  {
    categorie: "Marketing",
    finalite: "Publicité ciblée, retargeting [À COMPLÉTER]",
    duree: "[À COMPLÉTER]",
    consentement: "Requis",
  },
];

export default function PolitiqueCookies() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : [À COMPLÉTER]</p>
      <h1 className="text-3xl font-bold">Politique cookies</h1>
      <p className="mt-4 text-muted-foreground">
        Cette page explique comment Offside Foot Indoor utilise les cookies et technologies similaires.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
        <p className="text-muted-foreground">
          Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de votre visite sur un site web. Il permet au site de mémoriser vos préférences et d&apos;améliorer votre expérience.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">2. Catégories de cookies utilisés</h2>
        <ul className="space-y-3 sm:hidden">
          {CATEGORIES.map((c) => (
            <li key={c.categorie} className="rounded-xl border p-3">
              <p className="font-semibold">{c.categorie}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.finalite}</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Durée :</dt>
                  <dd>{c.duree}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Consentement :</dt>
                  <dd>{c.consentement}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold">Catégorie</th>
                <th className="text-left p-3 font-semibold">Finalité</th>
                <th className="text-left p-3 font-semibold">Durée</th>
                <th className="text-left p-3 font-semibold">Consentement</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {CATEGORIES.map((c) => (
                <tr key={c.categorie} className="border-t">
                  <td className="p-3 font-medium">{c.categorie}</td>
                  <td className="p-3">{c.finalite}</td>
                  <td className="p-3">{c.duree}</td>
                  <td className="p-3">{c.consentement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">3. Gestion du consentement</h2>
        <p className="text-muted-foreground">
          Lors de votre première visite, un bandeau de consentement vous permet d&apos;accepter, de refuser ou de personnaliser votre choix de cookies. <strong>Aucun cookie non essentiel n&apos;est déposé avant votre consentement.</strong>
        </p>
        <p className="text-muted-foreground">
          Vous pouvez modifier vos préférences à tout moment en cliquant sur le lien &quot;Gérer mes cookies&quot; dans le pied de page du site.
        </p>
        <p className="text-muted-foreground">
          Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies. Consultez les paramètres de votre navigateur pour en savoir plus.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">4. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question concernant notre utilisation des cookies :{" "}
          <a href="mailto:info@offsidefootindoor.be" className="underline text-primary">info@offsidefootindoor.be</a>
        </p>
      </section>
    </div>
  );
}
