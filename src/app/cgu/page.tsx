import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Offside Foot Indoor",
  description: "Conditions Générales d'Utilisation du site Offside Foot Indoor.",
};

export default function CGU() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : [À COMPLÉTER]</p>
      <h1 className="text-3xl font-bold">Conditions Générales d&apos;Utilisation</h1>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">1. Accès au site</h2>
        <p className="text-muted-foreground">
          Le site Offside Foot Indoor est accessible gratuitement à tout utilisateur disposant d&apos;un accès à Internet. Offside met tout en œuvre pour assurer l&apos;accès au site 24h/24, 7j/7, mais ne saurait être tenu responsable en cas d&apos;interruption pour maintenance, mise à jour ou cause de force majeure.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">2. Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          L&apos;ensemble des éléments du site (textes, images, logos, vidéos, design, code source) est protégé par les lois relatives à la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable de Offside, est strictement interdite.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">3. Responsabilité</h2>
        <p className="text-muted-foreground">
          Offside s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées sur le site. Toutefois, Offside ne saurait être tenu responsable des erreurs, omissions ou résultats obtenus suite à l&apos;utilisation de ces informations.
        </p>
        <p className="text-muted-foreground">
          Offside décline toute responsabilité en cas de dommages directs ou indirects résultant de l&apos;accès ou de l&apos;utilisation du site, y compris l&apos;inaccessibilité, les pertes de données ou les virus.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">4. Comportement de l&apos;utilisateur</h2>
        <p className="text-muted-foreground">L&apos;utilisateur s&apos;engage à :</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Ne pas utiliser le site à des fins illicites ou contraires à l&apos;ordre public</li>
          <li>Ne pas tenter de compromettre la sécurité ou le fonctionnement du site</li>
          <li>Fournir des informations exactes lors de ses réservations</li>
          <li>Respecter les droits de propriété intellectuelle de Offside</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">5. Liens externes</h2>
        <p className="text-muted-foreground">
          Le site peut contenir des liens vers des sites tiers (notamment SportFinder pour la réservation de terrains). Offside n&apos;exerce aucun contrôle sur le contenu de ces sites et décline toute responsabilité quant à leur contenu, leur politique de confidentialité ou leurs pratiques. L&apos;accès à ces sites se fait sous la seule responsabilité de l&apos;utilisateur.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">6. Modification des CGU</h2>
        <p className="text-muted-foreground">
          Offside se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le site. L&apos;utilisateur est invité à consulter régulièrement cette page.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">7. Droit applicable</h2>
        <p className="text-muted-foreground">
          Les présentes CGU sont soumises au droit belge. Tout litige sera soumis à la compétence des tribunaux de l&apos;arrondissement judiciaire de [À COMPLÉTER].
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">8. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative aux présentes CGU :{" "}
          <a href="mailto:info@offsidefootindoor.be" className="underline text-primary">info@offsidefootindoor.be</a>
        </p>
      </section>
    </div>
  );
}
