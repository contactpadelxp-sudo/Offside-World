import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique cookies | Offside Foot Indoor",
  description: "Politique d'utilisation des cookies sur Offside World.",
};

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
        <div className="overflow-x-auto">
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
              <tr className="border-t">
                <td className="p-3 font-medium">Nécessaires</td>
                <td className="p-3">Fonctionnement du site, mémorisation du consentement cookies, sécurité</td>
                <td className="p-3">Session / 12 mois</td>
                <td className="p-3">Non requis (intérêt légitime)</td>
              </tr>
              <tr className="border-t">
                <td className="p-3 font-medium">Mesure d&apos;audience</td>
                <td className="p-3">Statistiques anonymes de fréquentation [À COMPLÉTER — ex. : Google Analytics, Plausible]</td>
                <td className="p-3">[À COMPLÉTER]</td>
                <td className="p-3">Requis</td>
              </tr>
              <tr className="border-t">
                <td className="p-3 font-medium">Marketing</td>
                <td className="p-3">Publicité ciblée, retargeting [À COMPLÉTER]</td>
                <td className="p-3">[À COMPLÉTER]</td>
                <td className="p-3">Requis</td>
              </tr>
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
