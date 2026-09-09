import type { Metadata } from "next";
import { MAJ_LEGALE } from "@/data/entreprise";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Offside Foot Indoor",
  description: "Conditions Générales d'Utilisation du site Offside Foot Indoor.",
};

export default function CGU() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {MAJ_LEGALE}</p>
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
        {/*
          LA PHRASE PRÉCÉDENTE EST UNE EXCLUSION TOTALE DE RESPONSABILITÉ.

          Telle quelle, elle est nulle : l'article VI.83 du Code de droit
          économique interdit les clauses qui écartent la responsabilité du
          vendeur pour son dol, sa faute lourde, ou pour l'inexécution de ses
          obligations essentielles. Et une clause abusive n'est pas seulement
          inopposable — sa présence est en soi une infraction.

          On ne la supprime pas : elle a un objet légitime pour tout le reste
          (une panne d'hébergeur, un lien tiers cassé). On la borne, ce qui est
          la formulation reconnue. Le même correctif existe déjà à l'article 16
          des CGV, ce qui n'était pas le cas ici.
        */}
        <p className="text-muted-foreground">
          Ces limitations ne s&apos;appliquent pas au dol, à la faute lourde ou à l&apos;inexécution
          d&apos;une obligation essentielle d&apos;Offside, ni aux dommages corporels. Aucune
          disposition des présentes CGU ne vise à exclure ou limiter une responsabilité qui ne
          pourrait légalement l&apos;être, en particulier à l&apos;égard d&apos;un consommateur.
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
        {/*
          « [À COMPLÉTER] » s'affichait en clair sur une page publique.

          On ne le remplace pas par une clause d'attribution de compétence :
          imposer un tribunal à un consommateur est précisément ce que l'article
          VI.83, 23° du Code de droit économique range parmi les clauses
          abusives, et l'article 624 du Code judiciaire fixe déjà les règles de
          toute façon. La mention ne vaut donc que pour les clients
          professionnels, où elle est licite.
        */}
        <p className="text-muted-foreground">
          Les présentes CGU sont soumises au droit belge. À l&apos;égard d&apos;un consommateur, les
          règles légales impératives de compétence territoriale s&apos;appliquent et aucune clause
          des présentes n&apos;y déroge. Pour les autres utilisateurs, les tribunaux de
          l&apos;arrondissement judiciaire de Namur sont compétents.
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
