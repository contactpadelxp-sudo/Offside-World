/**
 * Identité de l'entreprise — source unique pour les pages légales,
 * le pied de page et les écrans de réservation.
 *
 * Valeurs communiquées par Brahim Bel Abbes le 17 septembre 2026, et qui
 * remplacent celles de Belantis : la société qui vend et encaisse est DBT
 * Partners SRL. Les champs `null` restent à compléter et s'affichent alors
 * « [à compléter] » sur le site — il n'en reste qu'un, le siège social, qui est
 * nul parce qu'il est IDENTIQUE à l'adresse d'exploitation, pas parce qu'il
 * manque.
 */

export const NOM_COMMERCIAL = "Offside Foot Indoor";

/**
 * Dénomination sociale — la société qui VEND et qui ENCAISSE.
 *
 * « Belantis » figurait ici jusqu'au 16 septembre 2026, avec son numéro
 * d'entreprise. C'était la mauvaise société : le compte Stripe est au nom de
 * DBT Partners, et le titulaire du compte est le vendeur au sens légal — c'est
 * lui qui encaisse, déclare la TVA, et que le client doit pouvoir identifier.
 *
 * Communiqué par Brahim Bel Abbes le 17 septembre 2026.
 */
export const DENOMINATION_SOCIALE: string | null = "DBT Partners";

/**
 * Forme juridique — SRL, SA, ASBL, indépendant en personne physique…
 *
 * OBLIGATOIRE SUR LES DOCUMENTS DE LA SOCIÉTÉ. L'article 2:20 du Code des
 * sociétés et des associations impose que tout acte, facture, bon de commande
 * ou courrier émanant d'une société mentionne sa dénomination ET sa forme
 * légale : « DBT Partners » seul ne suffirait pas.
 *
 * Communiquée le 17 septembre 2026.
 */
export const FORME_JURIDIQUE: string | null = "SRL";

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
 * RÉSOLU LE 17 SEPTEMBRE 2026 : le siège social de DBT Partners est Rue des
 * Orchidées 6 à 5030 Gembloux — la même adresse que le complexe. Gembloux est
 * en province de Namur, laquelle relève entièrement du tribunal de l'entreprise
 * de Liège, division Namur (vérifié auprès du site des Cours & Tribunaux).
 *
 * La valeur n'est donc plus déduite d'une vraisemblance mais de l'adresse
 * réelle, ce qui est la seule base acceptable pour l'imprimer sur un devis
 * engageant.
 */
export const RPM_TRIBUNAL: string | null = "Liège, division Namur";

/**
 * Siège social s'il diffère de l'adresse d'exploitation.
 *
 * C'est lui qui détermine le tribunal du RPM ci-dessus : les deux se
 * renseignent ensemble, ou pas du tout.
 */
export const SIEGE_SOCIAL: string | null = null; // Identique à l'adresse d'exploitation.

/**
 * Numéro d'entreprise à la Banque-Carrefour des Entreprises.
 *
 * DÉDUIT DU NUMÉRO DE TVA, et ce n'est pas un raccourci : en Belgique, le
 * numéro d'entreprise et le numéro de TVA sont le MÊME nombre — la TVA n'est
 * que le numéro d'entreprise préfixé de « BE ». Communiqué « BE 0788.645.632 »
 * le 17 septembre 2026, pour DBT Partners.
 */
export const BCE: string | null = "0788.645.632";

/**
 * Numéro de TVA, sans le préfixe « BE » — les pages l'ajoutent à l'affichage.
 *
 * Validé par sa clé de contrôle avant d'être inscrit ici : la règle belge veut
 * que les deux derniers chiffres valent `97 − (les huit premiers mod 97)`. Ici
 * 97 − (7886456 mod 97) = 97 − 65 = 32, et le numéro finit bien par 32. Un
 * numéro mal recopié aurait échoué ce test, au lieu de s'afficher des mois
 * durant sur des pages légales et dans chaque e-mail envoyé.
 */
export const TVA: string | null = "0788.645.632";

/** Responsable de la publication du site. */
export const RESPONSABLE_PUBLICATION: string | null = "Brahim Bel Abbes";

/**
 * LA RAISON SOCIALE COMPLÈTE : dénomination ET forme juridique, toujours
 * ensemble.
 *
 * L'article 2:20 du Code des sociétés impose les deux sur tout document émanant
 * de la société. Elles étaient jointes à un seul endroit — le PDF de devis —
 * si bien que les mentions légales, les CGV, la politique de confidentialité et
 * les e-mails affichaient « DBT Partners » tout court. Un nom sans forme légale
 * ne désigne pas une personne morale identifiable.
 *
 * Une seule fonction, employée partout : ajouter la forme à quatre endroits
 * séparés aurait garanti qu'un cinquième soit oublié.
 */
export const RAISON_SOCIALE: string | null = DENOMINATION_SOCIALE
  ? [DENOMINATION_SOCIALE, FORME_JURIDIQUE].filter(Boolean).join(" ")
  : null;

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
export const MAJ_LEGALE = "17 septembre 2026";

/** Affiche une valeur ou un marqueur explicite si elle n'est pas encore renseignée. */
export function ouACompleter(valeur: string | null, libelle = "à compléter"): string {
  return valeur ?? `[${libelle}]`;
}
