/**
 * Identité de l'entreprise — source unique pour les pages légales,
 * le pied de page et les écrans de réservation.
 *
 * Valeurs issues des documents fournis par le client (version du
 * 1er septembre 2026). Les champs `null` restent à compléter : ils
 * s'affichent alors comme « [à compléter] » sur le site.
 */

export const NOM_COMMERCIAL = "Offside Foot Indoor";

/*
 * ⚠ CES TROIS VALEURS DÉSIGNENT LA MAUVAISE SOCIÉTÉ. À CORRIGER AVANT LE
 *   PREMIER PAIEMENT RÉEL.
 *
 * `DENOMINATION_SOCIALE`, `BCE` et `TVA` ci-dessous sont ceux de **Belantis**,
 * communiqués le 12 septembre 2026. Or Brahim a confirmé le 15 septembre 2026
 * que **c'est DBT qui exploite le foot**, et le compte Stripe est bien au nom
 * de DBT.
 *
 * Le titulaire du compte Stripe est le VENDEUR au sens légal : c'est lui qui
 * encaisse, qui déclare la TVA, et que le client doit pouvoir identifier et
 * assigner. Tant que ces constantes disent « Belantis », les mentions légales,
 * les CGV, les devis PDF et chaque e-mail de confirmation nomment une personne
 * morale qui n'est pas le vendeur.
 *
 * Il manque, pour DBT : dénomination + forme juridique, numéro d'entreprise,
 * siège social. Voir A-FAIRE.md, section « Identité de l'entreprise ».
 *
 * Sans conséquence tant qu'on est en clés de test — aucune vente réelle n'a eu
 * lieu. Bloquant dès la première.
 */

/** Dénomination sociale (raison sociale). ⚠ Belantis : voir l'avertissement ci-dessus. */
export const DENOMINATION_SOCIALE: string | null = "Belantis";

/**
 * Forme juridique — SRL, SA, ASBL, indépendant en personne physique…
 *
 * OBLIGATOIRE SUR LES DOCUMENTS DE LA SOCIÉTÉ. L'article 2:20 du Code des
 * sociétés et des associations impose que tout acte, facture, bon de commande
 * ou courrier émanant d'une société mentionne sa dénomination ET sa forme
 * légale. « Belantis » seul ne suffit donc pas : il faut « Belantis SRL », ou
 * la forme réelle.
 *
 * Laissé à `null` plutôt que deviné : inscrire une forme juridique erronée sur
 * un devis engageant serait pire que de l'omettre.
 */
export const FORME_JURIDIQUE: string | null = null;

/**
 * Tribunal de l'entreprise du registre des personnes morales.
 *
 * Également imposé par l'article 2:20 du CSA : les documents doivent porter la
 * mention « RPM » suivie du tribunal compétent.
 *
 * LA RÈGLE, VÉRIFIÉE : c'est le tribunal de l'arrondissement du SIÈGE SOCIAL de
 * la société — pas celui de l'adresse d'exploitation, qui n'entre pas en ligne
 * de compte. Toute la province de Namur, Gembloux compris, relève du tribunal
 * de l'entreprise de Liège, division Namur.
 *
 * Reste donc `null` pour une raison précise, et non par prudence vague : le
 * siège social de DBT — la société qui exploite réellement le foot — n'est pas
 * connu. S'il est en province de Namur, la valeur est « Liège, division
 * Namur ». S'il est ailleurs, c'est un autre tribunal, et l'imprimer au jugé
 * sur un devis engageant serait une mention fausse.
 */
export const RPM_TRIBUNAL: string | null = null;

/**
 * Siège social s'il diffère de l'adresse d'exploitation.
 *
 * C'est lui qui détermine le tribunal du RPM ci-dessus : les deux se
 * renseignent ensemble, ou pas du tout.
 */
export const SIEGE_SOCIAL: string | null = null;

/**
 * Numéro d'entreprise à la Banque-Carrefour des Entreprises.
 *
 * DÉDUIT DU NUMÉRO DE TVA, et ce n'est pas un raccourci : en Belgique, le
 * numéro d'entreprise et le numéro de TVA sont le MÊME nombre — la TVA n'est
 * que le numéro d'entreprise préfixé de « BE ». Communiqué
 * « BE1025713731 » le 12 septembre 2026.
 */
export const BCE: string | null = "1025.713.731";

/**
 * Numéro de TVA, sans le préfixe « BE » — les pages l'ajoutent à l'affichage.
 *
 * Validé par sa clé de contrôle avant d'être inscrit ici : la règle belge veut
 * que les deux derniers chiffres valent `97 − (les huit premiers mod 97)`. Ici
 * 97 − (10257137 mod 97) = 97 − 66 = 31, et le numéro finit bien par 31. Un
 * numéro mal recopié aurait échoué ce test, au lieu de s'afficher des mois
 * durant sur des pages légales et dans chaque e-mail envoyé.
 */
export const TVA: string | null = "1025.713.731";

/** Responsable de la publication du site. */
export const RESPONSABLE_PUBLICATION: string | null = null;

export const ADRESSE = {
  rue: "Rue des Orchidées 6",
  codePostal: "5030",
  ville: "Gembloux",
  pays: "Belgique",
} as const;

export const ADRESSE_LIGNE = `${ADRESSE.rue}, ${ADRESSE.codePostal} ${ADRESSE.ville}, ${ADRESSE.pays}`;

export const EMAIL = "info@offsidefootindoor.be";

/*
 * Il n'y a volontairement PAS de constante « téléphone » ici.
 *
 * Le numéro a été retiré du site à la demande du client, et les blocs qui
 * l'affichaient — pied de page, pages légales, page d'erreur, modèles
 * d'e-mail — ont été retirés avec lui. Deux constantes à `null` avaient
 * d'abord été conservées « au cas où » : elles ne servaient à rien, puisque
 * leur redonner une valeur n'aurait rien réaffiché.
 *
 * Pour remettre le téléphone : ajouter les constantes ET rétablir les blocs.
 * `git log -S TELEPHONE_TEL` retrouve les endroits exacts.
 *
 * L'e-mail reste le moyen de contact direct, ce que la loi exige
 * (Code de droit économique, art. III.74) : il ne peut pas partir, lui.
 */

/** Date de la dernière mise à jour des documents légaux. */
export const MAJ_LEGALE = "1er septembre 2026";

/** Affiche une valeur ou un marqueur explicite si elle n'est pas encore renseignée. */
export function ouACompleter(valeur: string | null, libelle = "à compléter"): string {
  return valeur ?? `[${libelle}]`;
}
