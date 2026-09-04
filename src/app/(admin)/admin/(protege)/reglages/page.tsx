import { TestEmail } from "@/components/admin/test-email";
import { diagnosticEmail } from "@/lib/email/envoi";
import { baseConfiguree } from "@/lib/supabase/server";
import { AlerteTriangle, Coche, Reglages } from "@/components/icons";

/**
 * État de la configuration.
 *
 * Le back-office marche sans e-mails : ils sont ignorés en silence si le
 * fournisseur n'est pas configuré. « En silence » est précisément le problème —
 * cette page le rend visible, et permet de vérifier avant de découvrir le
 * contraire par un client qui n'a rien reçu.
 */

function Ligne({ ok, titre, detail }: { ok: boolean; titre: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-field/15 text-field" : "bg-destructive/15 text-destructive"
        }`}
      >
        {ok ? <Coche className="size-3" /> : <AlerteTriangle className="size-3" />}
      </span>
      <span>
        <span className="block text-sm font-medium">{titre}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
    </li>
  );
}

export default async function PageReglages() {
  const email = diagnosticEmail();
  const base = baseConfiguree();

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Reglages className="size-6 text-field" /> Réglages
      </h1>
      <p className="text-sm text-muted-foreground">
        Ce qui est branché, et ce qui ne l&apos;est pas.
      </p>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        État
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        <Ligne
          ok={base}
          titre="Base de données"
          detail={base ? "Connectée." : "Non configurée : le site ne peut ni lire ni écrire."}
        />
        <Ligne
          ok={email.cle}
          titre="Clé du fournisseur d'e-mails"
          detail={
            email.cle
              ? "Renseignée."
              : "Absente. Renseignez RESEND_API_KEY dans Vercel, puis redéployez."
          }
        />
        <Ligne
          ok={Boolean(email.expediteur)}
          titre="Adresse d'expédition"
          detail={
            email.expediteur ??
            "Absente. Renseignez EMAIL_EXPEDITEUR — elle doit être sur un domaine vérifié chez le fournisseur."
          }
        />
        <Ligne
          ok={!email.modeDemonstration}
          titre="Envois vers les clients"
          detail={
            email.modeDemonstration
              ? "Impossibles : l'expéditeur est le domaine de démonstration du fournisseur."
              : "Possibles : l'expéditeur est sur un domaine vérifié."
          }
        />
        <Ligne
          ok
          titre="Avis internes envoyés à"
          detail={email.complexe}
        />
        {email.pointPersonnalise && (
          <Ligne
            ok={false}
            titre="Point d'envoi personnalisé"
            detail="EMAIL_API_URL est défini : les e-mails ne partent pas chez le fournisseur habituel. À retirer en production."
          />
        )}
      </ul>

      {email.configure && email.modeDemonstration && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-kick/30 bg-kick/10 p-4 text-sm text-kick">
          <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Mode démonstration : vos clients ne reçoivent rien.</strong> L&apos;adresse
            d&apos;expédition est celle du fournisseur, pas la vôtre. Dans cet état, seule
            l&apos;adresse du titulaire du compte peut recevoir un e-mail — les confirmations
            envoyées aux clients échouent. Vérifiez le domaine chez le fournisseur, puis
            remplacez <span className="font-mono">EMAIL_EXPEDITEUR</span> par une adresse de ce
            domaine.
          </span>
        </p>
      )}

      {!email.configure && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Aucun e-mail ne part actuellement.</strong> Les réservations sont bien
            enregistrées, mais ni le client ni vous n&apos;êtes prévenus. Il faut ouvrir un compte
            chez le fournisseur et renseigner les variables ci-dessus.
          </span>
        </p>
      )}

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Vérification
      </h2>
      <TestEmail adresseParDefaut={email.complexe} />
    </div>
  );
}
