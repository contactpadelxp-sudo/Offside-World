import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente | Offside World",
  description: "CGV du site Offside World — BELANTIS.",
};

export default function CGV() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : [À COMPLÉTER]</p>
      <h1 className="text-3xl font-bold">Conditions Générales de Vente</h1>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">1. Objet</h2>
        <p className="text-muted-foreground">
          Les présentes Conditions Générales de Vente (ci-après &quot;CGV&quot;) régissent les relations contractuelles entre BELANTIS, exploitant du complexe Offside World, et toute personne (ci-après &quot;le Client&quot;) effectuant une réservation via le site offsideworld.be.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">2. Prix</h2>
        <p className="text-muted-foreground">
          Les prix sont indiqués en euros (€) toutes taxes comprises (TVA belge incluse). BELANTIS se réserve le droit de modifier ses tarifs à tout moment ; les prix applicables sont ceux en vigueur au moment de la réservation.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">3. Réservation et paiement</h2>
        <p className="text-muted-foreground">
          La réservation est confirmée après paiement intégral via PayPal. Le Client reçoit un email de confirmation. Le paiement est traité intégralement par PayPal (Europe) S.à r.l. et Cie, S.C.A. — aucune donnée de carte bancaire n&apos;est stockée par BELANTIS.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">4. Politique d&apos;annulation et de remboursement</h2>
        <p className="text-muted-foreground">[À COMPLÉTER — Exemple de structure :]</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Annulation plus de [X] jours avant la date : remboursement intégral</li>
          <li>Annulation entre [X] et [Y] jours : remboursement de [X] %</li>
          <li>Annulation moins de [Y] jours ou no-show : aucun remboursement</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
        <h2 className="text-xl font-bold">5. Droit de rétractation</h2>
        <p className="text-muted-foreground">
          Conformément à l&apos;article VI.53, 12° du Code de droit économique belge (transposant l&apos;article 16(l) de la directive 2011/83/UE), <strong>le droit de rétractation ne s&apos;applique pas</strong> aux contrats de fourniture de services de loisirs lorsque le contrat prévoit une date ou une période d&apos;exécution spécifique.
        </p>
        <p className="text-muted-foreground">
          En réservant une prestation à date déterminée (anniversaire, location de terrain, entrée libre, team building), le Client reconnaît et accepte que le droit de rétractation de 14 jours prévu pour les contrats à distance ne s&apos;applique pas.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">6. Réclamations</h2>
        <p className="text-muted-foreground">
          Toute réclamation doit être adressée à{" "}
          <a href="mailto:contact@offsideworld.be" className="underline text-primary">contact@offsideworld.be</a>{" "}
          dans un délai de [À COMPLÉTER] jours suivant la prestation. Nous nous engageons à répondre dans un délai de 30 jours.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">7. Médiation et règlement en ligne des litiges</h2>
        <p className="text-muted-foreground">
          En cas de litige non résolu, le Client peut recourir au Service de Médiation pour le Consommateur :
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>[Organisme de médiation belge — À COMPLÉTER]</li>
        </ul>
        <p className="text-muted-foreground mt-3">
          Conformément au règlement européen n° 524/2013, le Client peut également soumettre sa plainte via la plateforme de Règlement en Ligne des Litiges (ODR) de la Commission européenne :{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">8. Droit applicable et juridiction</h2>
        <p className="text-muted-foreground">
          Les présentes CGV sont soumises au droit belge. En cas de litige, les tribunaux de l&apos;arrondissement judiciaire de [À COMPLÉTER] sont seuls compétents, sans préjudice du droit du consommateur de saisir le tribunal de son domicile conformément au Code de droit économique.
        </p>
      </section>
    </div>
  );
}
