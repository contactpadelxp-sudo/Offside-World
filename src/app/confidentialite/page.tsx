import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Offside World",
  description: "Politique de confidentialité et RGPD du site Offside World.",
};

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:pt-28 md:pb-20">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : [À COMPLÉTER]</p>
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mt-4 text-muted-foreground">
        La présente politique décrit comment BELANTIS (&quot;nous&quot;, &quot;notre&quot;) collecte, utilise et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la législation belge applicable.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">1. Responsable du traitement</h2>
        <p className="text-muted-foreground">
          BELANTIS — [Adresse à compléter], Belgique<br />
          Email : <a href="mailto:rgpd@offsideworld.be" className="underline text-primary">rgpd@offsideworld.be</a><br />
          Numéro d&apos;entreprise : [À COMPLÉTER]
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">2. Données collectées</h2>
        <p className="text-muted-foreground">Nous collectons uniquement les données strictement nécessaires :</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Réservation :</strong> nom, prénom, email, téléphone</li>
          <li><strong>Anniversaire :</strong> prénom et âge de l&apos;enfant fêté, nombre d&apos;enfants invités</li>
          <li><strong>Team Building :</strong> nom de l&apos;entreprise, nom du contact, email, téléphone</li>
          <li><strong>Paiement :</strong> traité intégralement par PayPal — aucune donnée de carte n&apos;est stockée sur nos serveurs</li>
          <li><strong>Navigation :</strong> cookies (voir <a href="/politique-cookies" className="underline text-primary">Politique cookies</a>)</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">3. Finalités et bases légales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold">Finalité</th>
                <th className="text-left p-3 font-semibold">Base légale</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t"><td className="p-3">Gestion des réservations</td><td className="p-3">Exécution du contrat (art. 6.1.b RGPD)</td></tr>
              <tr className="border-t"><td className="p-3">Traitement des paiements</td><td className="p-3">Exécution du contrat</td></tr>
              <tr className="border-t"><td className="p-3">Envoi de la confirmation par email</td><td className="p-3">Exécution du contrat</td></tr>
              <tr className="border-t"><td className="p-3">Newsletter / offres commerciales</td><td className="p-3">Consentement (art. 6.1.a RGPD)</td></tr>
              <tr className="border-t"><td className="p-3">Obligations comptables et fiscales</td><td className="p-3">Obligation légale (art. 6.1.c RGPD)</td></tr>
              <tr className="border-t"><td className="p-3">Mesure d&apos;audience (cookies)</td><td className="p-3">Consentement</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">4. Durées de conservation</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Données de réservation :</strong> 3 ans après la prestation</li>
          <li><strong>Données comptables :</strong> 7 ans (obligation légale belge)</li>
          <li><strong>Données newsletter :</strong> jusqu&apos;au retrait du consentement</li>
          <li><strong>Cookies :</strong> voir <a href="/politique-cookies" className="underline text-primary">Politique cookies</a></li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">5. Sous-traitants et destinataires</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>PayPal (Europe) S.à r.l. et Cie, S.C.A.</strong> — traitement des paiements</li>
          <li><strong>Vercel Inc.</strong> — hébergement du site (USA, clauses contractuelles types)</li>
          <li><strong>[Fournisseur d&apos;emails — À COMPLÉTER]</strong> — envoi des confirmations</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">6. Transferts hors UE</h2>
        <p className="text-muted-foreground">
          Certains sous-traitants (Vercel) sont basés aux États-Unis. Ces transferts sont encadrés par des clauses contractuelles types (CCT) approuvées par la Commission européenne, conformément à l&apos;article 46 du RGPD. [À vérifier et compléter selon les sous-traitants retenus.]
        </p>
      </section>

      <section className="mt-8 space-y-4 rounded-lg border-2 border-kick/30 bg-kick/5 p-6">
        <h2 className="text-xl font-bold">7. Données des mineurs</h2>
        <p className="text-muted-foreground">
          Dans le cadre des réservations d&apos;anniversaire, nous appliquons le principe de <strong>minimisation des données</strong> : seuls le prénom, l&apos;âge de l&apos;enfant fêté et le nombre d&apos;enfants invités sont collectés. Aucune autre donnée concernant les enfants n&apos;est demandée.
        </p>
        <p className="text-muted-foreground">
          La réservation est effectuée par le parent ou le responsable légal de l&apos;enfant, qui donne son consentement au traitement de ces données. Les données relatives aux mineurs sont conservées selon les mêmes durées que les données de réservation et sont supprimées à l&apos;issue de cette période.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">8. Vos droits</h2>
        <p className="text-muted-foreground">Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong>Droit d&apos;accès</strong> (art. 15) : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> (art. 16) : corriger des données inexactes</li>
          <li><strong>Droit à l&apos;effacement</strong> (art. 17) : demander la suppression de vos données</li>
          <li><strong>Droit à la limitation</strong> (art. 18) : restreindre le traitement</li>
          <li><strong>Droit à la portabilité</strong> (art. 20) : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition</strong> (art. 21) : s&apos;opposer au traitement</li>
          <li><strong>Retrait du consentement</strong> : à tout moment, sans affecter la licéité du traitement antérieur</li>
        </ul>
        <p className="text-muted-foreground">
          Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:rgpd@offsideworld.be" className="underline text-primary">rgpd@offsideworld.be</a>.
          Nous répondrons dans un délai de 30 jours.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">9. Réclamation</h2>
        <p className="text-muted-foreground">
          Si vous estimez que le traitement de vos données n&apos;est pas conforme, vous pouvez introduire une réclamation auprès de l&apos;Autorité de protection des données (APD/GBA) :
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Autorité de protection des données (APD)</li>
          <li>Rue de la Presse 35, 1000 Bruxelles</li>
          <li>Tél. : +32 (0)2 274 48 00</li>
          <li>Email : contact@apd-gba.be</li>
          <li>Site : <span className="font-mono">www.autoriteprotectiondonnees.be</span></li>
        </ul>
      </section>
    </div>
  );
}
