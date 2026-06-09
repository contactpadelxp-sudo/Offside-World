import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | Offside World",
  description: "Mentions légales du site Offside World.",
};

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : [À COMPLÉTER]</p>
      <h1 className="text-3xl font-bold">Mentions légales</h1>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">1. Éditeur du site</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Raison sociale :</strong> BELANTIS</li>
          <li><strong>Forme juridique :</strong> [À COMPLÉTER — ex. : SRL, SA]</li>
          <li><strong>Numéro d&apos;entreprise (BCE) :</strong> [À COMPLÉTER — ex. : 0XXX.XXX.XXX]</li>
          <li><strong>Numéro de TVA :</strong> BE [À COMPLÉTER]</li>
          <li><strong>Siège social :</strong> [Adresse à compléter], Belgique</li>
          <li><strong>Téléphone :</strong> [À COMPLÉTER]</li>
          <li><strong>Email :</strong> contact@offsideworld.be</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">2. Directeur de la publication</h2>
        <p className="text-muted-foreground">[Nom et prénom du directeur de publication — À COMPLÉTER]</p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">3. Hébergeur</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Nom :</strong> Vercel Inc.</li>
          <li><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
          <li><strong>Site web :</strong> vercel.com</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">4. Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          L&apos;ensemble du contenu du site (textes, images, logos, vidéos, graphismes, icônes) est la propriété exclusive de BELANTIS ou de ses partenaires et est protégé par les lois belges et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">5. Protection des données</h2>
        <p className="text-muted-foreground">
          Pour toute information relative au traitement de vos données personnelles, consultez notre{" "}
          <a href="/confidentialite" className="underline text-primary">Politique de confidentialité</a>.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">6. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question, vous pouvez nous contacter à l&apos;adresse{" "}
          <a href="mailto:contact@offsideworld.be" className="underline text-primary">contact@offsideworld.be</a>.
        </p>
      </section>
    </div>
  );
}
