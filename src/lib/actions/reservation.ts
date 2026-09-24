"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { verifierCreneau } from "@/lib/db/creneaux";
import {
  lireTarifFormule,
  lireTarifsOptions,
} from "@/lib/db/referentiel";
import {
  CreneauDejaPris,
  enregistrerDemandeDevis,
  candidatsTeamBuilding,
  tenirCreneauxDevis,
  supprimerDemandeDevis,
  enregistrerReservation,
  expirerReservationsAbandonnees,
  libererReservationAbandonnee,
} from "@/lib/db/reservations";
import { envoyerTous } from "@/lib/email/envoi";
import {
  auClientDevisRecu,
  auClientReservationEnregistree,
  auComplexeNouveauDevis,
  auComplexeNouvelleReservation,
  type DevisEmail,
  type RecapEmail,
} from "@/lib/email/modeles";
import { heure, jourLisibleCap } from "@/lib/temps";
import { AGE_ABSURDE_AU_DELA, AGE_MINIMUM } from "@/data/reglement";
import { autoriserPartage } from "@/lib/limiteur-partage";
import { baseConfiguree } from "@/lib/supabase/server";
import { SaisieInvalide, booleen, email, entier, identifiants, jour, telephone, texte, texteFacultatif, uuid, vrai } from "@/lib/saisie";
import {
  BUBBLE_MAX_PERSONNES,
  BUBBLE_MIN_PERSONNES,
  TEAM_BUILDING_MAX_PARTICIPANTS,
  TEAM_BUILDING_MIN_PARTICIPANTS,
} from "@/data/bubble-team";
import { totalAnniversaireCents, totalBubbleCents } from "@/lib/tarification";
import { PERIODES, type PeriodeTeamBuilding } from "@/lib/demi-journees";
import { conflitSurHeureLocale, jourISODeLaDate } from "@/data/plages-sport-finder";

/** « 14:00 » → 840. */
function enMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
import { creerSessionPaiement } from "@/lib/paiement/session";

/**
 * Écriture des réservations.
 *
 * TROIS RÈGLES, dans cet ordre :
 *
 * 1. LE PRIX N'EST JAMAIS LU DEPUIS LE NAVIGATEUR. Le total affiché dans le
 *    funnel n'est qu'un aperçu ; celui qui est écrit en base est recalculé ici
 *    à partir des tables `formules` et `options`. Un client qui modifierait le
 *    total dans sa console changerait ce qu'il voit, pas ce qu'il doit.
 *
 * 2. TOUTE SAISIE EST BORNÉE ET REVÉRIFIÉE. Une Server Action est une URL
 *    publique : elle est appelable sans passer par le formulaire.
 *
 * 3. LA BASE A LE DERNIER MOT SUR LA DISPONIBILITÉ. Le créneau est relu, et
 *    même relu, c'est l'index unique partiel qui tranche en cas d'égalité
 *    parfaite entre deux clients.
 */

export type Resultat =
  | {
      ok: true;
      reference: string;
      total: number;
      /**
       * Adresse de la page de paiement Stripe, quand le paiement en ligne est
       * configuré. Absente sinon : le site enregistre alors la réservation
       * « à confirmer » et le complexe rappelle, comme aujourd'hui.
       *
       * Le client doit y être envoyé ; la réservation n'est PAS confirmée tant
       * qu'elle n'est pas payée.
       */
      urlPaiement?: string;
    }
  | { ok: false; message: string; champ?: string };

// ── Garde-fous communs ───────────────────────────────────────────────────────

const MESSAGE_GENERIQUE =
  "La réservation n'a pas pu être enregistrée. Merci de réessayer dans un instant.";

/**
 * Identifiant de l'appelant pour la limitation de débit.
 * `x-forwarded-for` est renseigné par le proxy de Vercel ; en local il est
 * absent, et tout le monde partage alors le même compteur — sans importance.
 */
async function appelant(): Promise<string> {
  const entetes = await headers();
  const chaine = entetes.get("x-forwarded-for") ?? "";
  return chaine.split(",")[0]?.trim() || "local";
}

/**
 * 5 écritures par tranche de 10 minutes et par appelant.
 *
 * Compteur PARTAGÉ entre les instances depuis le 17 septembre 2026 : celui en
 * mémoire se contournait en répartissant les requêtes, ce qui laissait remplir
 * la base de fausses réservations — et, depuis que Stripe encaisse, ouvrir
 * autant de sessions de paiement.
 */
async function quotaDepasse(action: string): Promise<boolean> {
  return !(await autoriserPartage(`${action}:${await appelant()}`, 5, 10 * 60_000));
}

/** Traduit une exception en réponse affichable, sans jamais divulguer l'interne. */
function enEchec(e: unknown): Resultat {
  if (e instanceof SaisieInvalide) return { ok: false, message: e.message, champ: e.champ };
  if (e instanceof CreneauDejaPris) {
    return {
      ok: false,
      message: "Ce créneau vient d'être réservé. Choisissez-en un autre.",
      champ: "creneau",
    };
  }
  console.error("Réservation :", e);
  return { ok: false, message: MESSAGE_GENERIQUE };
}

function verifierBase(): void {
  if (!baseConfiguree()) throw new Error("Base non configurée.");
}

// ── Anniversaire ─────────────────────────────────────────────────────────────

export interface SaisieAnniversaire {
  creneauId: string;
  formuleId: string;
  nbEnfants: number;
  enfantPrenom: string;
  enfantAge: number;
  optionsIds: string[];
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  allergies?: string;
  /**
   * Consentement EXPLICITE au traitement des allergies (RGPD art. 9.2.a).
   *
   * Une case distincte de celle des CGV, et c'est tout l'enjeu : un
   * consentement noyé dans l'acceptation de conditions générales n'est pas
   * explicite. Sans elle, les allergies ne sont pas enregistrées — voir
   * l'action.
   */
  allergiesConsenties?: boolean;
  remarques?: string;
  newsletter?: boolean;
  cgv: boolean;
}

export async function reserverAnniversaire(saisie: SaisieAnniversaire): Promise<Resultat> {
  try {
    verifierBase();

    // 1. Bornage de la saisie, avant toute requête.
    const creneauId = uuid(saisie?.creneauId, "Créneau");
    const formuleId = texte(saisie?.formuleId, "Formule", { max: 60 });
    const enfantPrenom = texte(saisie?.enfantPrenom, "Prénom de l'enfant", { min: 1, max: 60 });
    /*
      4 ANS MINIMUM, ET PAS DE MAXIMUM À 17 ANS.

      Le plancher était à 1 an, le plafond à 17. Brahim a précisé le
      17 septembre 2026 : à partir de 4 ans, et sans limite haute — le Bubble
      Foot se joue aussi entre adultes, et un anniversaire de trentenaire est
      une vente comme une autre. Le plafond refusait donc de vraies commandes.

      99 reste comme garde-fou de saisie : ce n'est pas une limite d'âge mais
      la borne au-delà de laquelle un nombre n'est plus un âge.
    */
    const enfantAge = entier(saisie?.enfantAge, "Âge", {
      min: AGE_MINIMUM,
      max: AGE_ABSURDE_AU_DELA,
    });
    const optionsIds = identifiants(saisie?.optionsIds, "Options", 10);
    const clientNom = texte(saisie?.clientNom, "Nom", { min: 2, max: 120 });
    const clientEmail = email(saisie?.clientEmail, "E-mail");
    const clientTelephone = telephone(saisie?.clientTelephone, "Téléphone");
    const remarques = texteFacultatif(saisie?.remarques, "Remarques", { max: 1000 });
    const newsletter = booleen(saisie?.newsletter);
    vrai(saisie?.cgv, "cgv", "Les conditions générales de vente doivent être acceptées.");

    /*
      UNE ALLERGIE EST UNE DONNÉE DE SANTÉ, ET ELLE NE S'ENREGISTRE PAS SANS
      CONSENTEMENT EXPLICITE.

      L'article 9 interdit par principe de traiter des données de santé ; seule
      une exception lève l'interdiction, et la seule qui vaille ici est le
      consentement explicite (art. 9.2.a). Explicite veut dire séparé : une
      case à part, qui nomme la donnée et son usage, jamais incluse dans
      l'acceptation des conditions générales.

      ON NE REFUSE PAS LA RÉSERVATION, ON N'ENREGISTRE PAS L'ALLERGIE. Refuser
      punirait le client d'un choix qui lui appartient, sur un formulaire qu'il
      vient de remplir en entier. Le champ est facultatif : ne pas consentir
      est une réponse valable, et elle doit coûter le champ, pas la fête.

      L'horodatage démontre le consentement, comme l'exige l'article 7.1 : une
      date se produit en cas de contestation, un booléen s'affirme seulement.
      La base porte la même règle en contrainte (migration 0030) — aucun autre
      chemin d'écriture ne peut la contourner.
    */
    const consentementSante = booleen(saisie?.allergiesConsenties);
    const allergies = consentementSante
      ? texteFacultatif(saisie?.allergies, "Allergies", { max: 500 })
      : null;

    /*
      LE QUOTA SE CONSOMME APRÈS LE BORNAGE, PAS AVANT.

      Il était le tout premier test, donc CHAQUE soumission comptait — y compris
      celles que le bornage allait refuser une ligne plus loin. Un formulaire
      mal rempli cinq fois, un e-mail invalide, un âge non choisi, et le client
      lisait « Trop de tentatives » sans avoir rien fait de mal.

      Déplacé ici, il ne compte que les soumissions BIEN FORMÉES, celles qui
      vont réellement écrire en base. Le bornage, lui, ne touche jamais la
      base : ne pas compter une saisie malformée ne coûte rien et ne protège
      rien de moins — le chemin cher reste derrière la garde.

      Reste le refus venu du site, un créneau pris entre-temps, qui consomme
      encore une unité. Il est traité à l'autre bout : la liste est désormais
      relue après un échec, donc le client ne peut plus recliquer le créneau
      perdu et s'exclure lui-même.
    */
    if (await quotaDepasse("anniversaire")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

    // 2. Le référentiel décide du prix, et des bornes du nombre d'enfants.
    const formule = await lireTarifFormule(formuleId);
    if (!formule) return { ok: false, message: "Cette formule n'est plus proposée.", champ: "formule" };

    const nbEnfants = entier(saisie?.nbEnfants, "Nombre de participants", { min: 1, max: formule.enfantsMax });

    /*
      L'ÂGE MAXIMUM APPARTIENT À LA FORMULE, PAS AU CODE.

      Il est vérifié ICI et non à la validation de saisie plus haut, parce
      qu'il dépend de la formule choisie — qu'on vient seulement de lire. La
      borne de saisie ne fait que refuser ce qui n'est plus un âge.

      `null` veut dire « pas de limite », et c'est le cas des deux formules
      aujourd'hui. Le champ existe pour que l'exploitant puisse fermer un
      forfait aux adultes d'un réglage dans /admin/tarifs, sans redéploiement.

      Le message nomme la limite : « Cette formule est réservée aux moins de
      18 ans » se comprend, « âge invalide » envoie chercher.
    */
    if (formule.ageMax !== null && enfantAge > formule.ageMax) {
      return {
        ok: false,
        message: `La formule ${formule.nom} est réservée aux ${formule.ageMax} ans et moins.`,
        champ: "enfantAge",
      };
    }

    // 3. Le créneau est relu en base : type, ouverture, délai minimum, disponibilité.
    await expirerReservationsAbandonnees();
    const creneau = await verifierCreneau(creneauId, "anniversaire");
    if (!creneau) {
      return { ok: false, message: "Ce créneau n'est plus disponible.", champ: "creneau" };
    }
    if (nbEnfants > creneau.capacite) {
      return {
        ok: false,
        message: `Cet espace accueille ${creneau.capacite} participants au maximum.`,
        champ: "nbEnfants",
      };
    }

    // 4. Les options doivent toutes exister et être actives ; sinon on refuse
    //    plutôt que d'ignorer silencieusement celle que le client croyait avoir.
    const tarifsOptions = await lireTarifsOptions(optionsIds);
    if (tarifsOptions.length !== optionsIds.length) {
      return { ok: false, message: "Une des options choisies n'est plus disponible.", champ: "options" };
    }

    // 5. Le total, en centimes entiers. Le calcul vit dans `tarification.ts`
    //    pour pouvoir être vérifié par des tests : c'est le seul endroit du
    //    projet où une erreur se traduit directement en euros.
    const totalCents = totalAnniversaireCents(
      formule,
      nbEnfants,
      tarifsOptions.map((o) => o.prixCents)
    );

    const { reference, id: reservationId } = await enregistrerReservation({
      type: "anniversaire",
      creneau_id: creneau.id,
      formule_id: formule.id,
      nb_enfants: nbEnfants,
      enfant_prenom: enfantPrenom,
      enfant_age: enfantAge,
      options_ids: tarifsOptions.map((o) => o.id),
      total_cents: totalCents,
      client_nom: clientNom,
      client_email: clientEmail,
      client_telephone: clientTelephone,
      newsletter,
      // L'ARTICLE 7.1 DU RGPD DEMANDE DE POUVOIR DÉMONTRER LE CONSENTEMENT, et
      // un booléen ne démontre rien : il ne dit ni quand, ni à quoi. Nul quand
      // la case n'est pas cochée — « non consenti le 3 mars » n'existe pas.
      newsletter_le: newsletter ? new Date().toISOString() : null,
      cgv_acceptees_le: new Date().toISOString(),
      allergies,
      // Toujours écrits ensemble : la contrainte `allergies_consenties` de la
      // migration 0030 refuse l'un sans l'autre.
      allergies_consenties_le: allergies ? new Date().toISOString() : null,
      remarques,
    });

    // Les e-mails partent APRÈS la réponse : le client n'attend pas le
    // fournisseur, et un envoi raté ne remet pas la réservation en cause.
    const recap: RecapEmail = {
      reference,
      activite: `Anniversaire — formule ${formule.nom}`,
      detail: `${nbEnfants} enfants — ${enfantPrenom}${enfantAge ? `, ${enfantAge} ans` : ""}`,
      jourLabel: jourLisibleCap(creneau.debut),
      debut: heure(creneau.debut),
      fin: heure(creneau.fin),
      espaceNom: creneau.espaceNom,
      totalCents,
      clientNom,
      clientEmail,
      clientTelephone,
      options: tarifsOptions.map((o) => o.libelle),
      allergieSignalee: Boolean(allergies),
      remarques,
    };
    /*
      LE PAIEMENT CHANGE QUI ANNONCE QUOI, ET QUAND.

      Sans paiement en ligne, la réservation est enregistrée « à confirmer » :
      on prévient le client tout de suite, et le complexe le rappelle.

      Avec paiement, envoyer « votre réservation est enregistrée » ici serait
      faux — rien n'est acquis tant que le client n'a pas payé, et le créneau
      sera libéré s'il abandonne. Les e-mails partent donc du webhook, une fois
      l'argent encaissé ; c'est lui aussi qui confirme la réservation.

      SI LA CRÉATION DE LA SESSION ÉCHOUE, ON LIBÈRE LE CRÉNEAU.

      La réservation est écrite AVANT cet appel : c'est elle qui tient le
      créneau pendant que le client paie. Quand Stripe est indisponible,
      l'exception remonte et le client lit « réessayez dans un instant » — mais
      la réservation restait en base, si bien qu'à son nouvel essai son PROPRE
      créneau lui était refusé comme déjà pris, pendant quarante-cinq minutes.

      Le commentaire affirmait le contraire depuis l'origine : ce n'était pas un
      choix assumé, c'était faux. On libère donc avant de relancer l'erreur.
    */
    let paiement;
    try {
      paiement = await creerSessionPaiement({
        reservationId,
        reference,
        clientEmail,
        ligne: {
          libelle: `Anniversaire — formule ${formule.nom}`,
          description: `${jourLisibleCap(creneau.debut)}, ${heure(creneau.debut)} – ${heure(creneau.fin)} · ${nbEnfants} enfants`,
          montantCents: totalCents,
        },
      });
    } catch (e) {
      await libererReservationAbandonnee(reservationId);
      throw e;
    }

    /*
      `paiement` vaut `null` UNIQUEMENT quand Stripe n'est pas configuré.

      Un `.catch(() => null)` enveloppait cet appel, si bien qu'une panne de
      Stripe — indisponibilité, délai dépassé, session sans URL — retombait sur
      la même valeur que « le paiement en ligne n'existe pas ». Le client
      recevait alors « votre créneau est retenu, nous vous recontactons »,
      alors que le délai d'expiration, lui, suit la CONFIGURATION et non le
      succès : 45 minutes, pas 48 heures. Le créneau était donc rendu à la
      vente pendant que le client attendait un appel.

      Sans le repli, l'exception remonte au `catch` de la fonction, qui rend un
      message d'attente honnête — et le `try` ci-dessus a libéré le créneau, si
      bien que le client retrouve bien le sien en recommençant. Il doit
      ressaisir le formulaire : le tunnel ne conserve rien, et c'est un moindre
      mal comparé à se voir refuser sa propre date.
    */
    if (!paiement) {
      after(() =>
        envoyerTous([auClientReservationEnregistree(recap), auComplexeNouvelleReservation(recap)])
      );
    }

    return {
      ok: true,
      reference,
      total: totalCents / 100,
      ...(paiement ? { urlPaiement: paiement.url } : {}),
    };
  } catch (e) {
    return enEchec(e);
  }
}

// ── Bubble Foot ──────────────────────────────────────────────────────────────

export interface SaisieBubble {
  creneauId: string;
  nbPersonnes: number;
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  remarques?: string;
  newsletter?: boolean;
  cgv: boolean;
}

export async function reserverBubble(saisie: SaisieBubble): Promise<Resultat> {
  try {
    verifierBase();

    const creneauId = uuid(saisie?.creneauId, "Créneau");
    const nbPersonnes = entier(saisie?.nbPersonnes, "Nombre de personnes", {
      min: BUBBLE_MIN_PERSONNES,
      max: BUBBLE_MAX_PERSONNES,
    });
    const clientNom = texte(saisie?.clientNom, "Nom", { min: 2, max: 120 });
    const clientEmail = email(saisie?.clientEmail, "E-mail");
    const clientTelephone = telephone(saisie?.clientTelephone, "Téléphone");
    const remarques = texteFacultatif(saisie?.remarques, "Remarques", { max: 1000 });
    const newsletter = booleen(saisie?.newsletter);
    vrai(saisie?.cgv, "cgv", "Les conditions générales de vente doivent être acceptées.");

    // Après le bornage, comme dans `reserverAnniversaire` : seules les
    // soumissions bien formées consomment une unité.
    if (await quotaDepasse("bubble")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

    await expirerReservationsAbandonnees();
    const creneau = await verifierCreneau(creneauId, "bubble");
    if (!creneau) {
      return { ok: false, message: "Ce créneau n'est plus disponible.", champ: "creneau" };
    }
    if (nbPersonnes > creneau.capacite) {
      return {
        ok: false,
        message: `Ce terrain accueille ${creneau.capacite} personnes au maximum.`,
        champ: "nbPersonnes",
      };
    }

    // Tarif à la personne, minimum facturé compris. Le minimum est déjà imposé
    // par le bornage ci-dessus : la multiplication suffit.
    const totalCents = totalBubbleCents(nbPersonnes);

    const { reference, id: reservationId } = await enregistrerReservation({
      type: "bubble",
      creneau_id: creneau.id,
      nb_personnes: nbPersonnes,
      total_cents: totalCents,
      client_nom: clientNom,
      client_email: clientEmail,
      client_telephone: clientTelephone,
      newsletter,
      newsletter_le: newsletter ? new Date().toISOString() : null,
      cgv_acceptees_le: new Date().toISOString(),
      remarques,
    });

    const recap: RecapEmail = {
      reference,
      activite: "Bubble Foot",
      detail: `${nbPersonnes} personnes`,
      jourLabel: jourLisibleCap(creneau.debut),
      debut: heure(creneau.debut),
      fin: heure(creneau.fin),
      espaceNom: creneau.espaceNom,
      totalCents,
      clientNom,
      clientEmail,
      clientTelephone,
      remarques,
    };
    /*
      LE PAIEMENT CHANGE QUI ANNONCE QUOI, ET QUAND.

      Sans paiement en ligne, la réservation est enregistrée « à confirmer » :
      on prévient le client tout de suite, et le complexe le rappelle.

      Avec paiement, envoyer « votre réservation est enregistrée » ici serait
      faux — rien n'est acquis tant que le client n'a pas payé, et le créneau
      sera libéré s'il abandonne. Les e-mails partent donc du webhook, une fois
      l'argent encaissé ; c'est lui aussi qui confirme la réservation.

      SI LA CRÉATION DE LA SESSION ÉCHOUE, ON LIBÈRE LE CRÉNEAU.

      La réservation est écrite AVANT cet appel : c'est elle qui tient le
      créneau pendant que le client paie. Quand Stripe est indisponible,
      l'exception remonte et le client lit « réessayez dans un instant » — mais
      la réservation restait en base, si bien qu'à son nouvel essai son PROPRE
      créneau lui était refusé comme déjà pris, pendant quarante-cinq minutes.

      Le commentaire affirmait le contraire depuis l'origine : ce n'était pas un
      choix assumé, c'était faux. On libère donc avant de relancer l'erreur.
    */
    let paiement;
    try {
      paiement = await creerSessionPaiement({
        reservationId,
        reference,
        clientEmail,
        ligne: {
          libelle: "Bubble Foot",
          description: `${jourLisibleCap(creneau.debut)}, ${heure(creneau.debut)} – ${heure(creneau.fin)} · ${nbPersonnes} personnes`,
          montantCents: totalCents,
        },
      });
    } catch (e) {
      await libererReservationAbandonnee(reservationId);
      throw e;
    }

    /*
      `paiement` vaut `null` UNIQUEMENT quand Stripe n'est pas configuré.

      Un `.catch(() => null)` enveloppait cet appel, si bien qu'une panne de
      Stripe — indisponibilité, délai dépassé, session sans URL — retombait sur
      la même valeur que « le paiement en ligne n'existe pas ». Le client
      recevait alors « votre créneau est retenu, nous vous recontactons »,
      alors que le délai d'expiration, lui, suit la CONFIGURATION et non le
      succès : 45 minutes, pas 48 heures. Le créneau était donc rendu à la
      vente pendant que le client attendait un appel.

      Sans le repli, l'exception remonte au `catch` de la fonction, qui rend un
      message d'attente honnête — et le `try` ci-dessus a libéré le créneau, si
      bien que le client retrouve bien le sien en recommençant. Il doit
      ressaisir le formulaire : le tunnel ne conserve rien, et c'est un moindre
      mal comparé à se voir refuser sa propre date.
    */
    if (!paiement) {
      after(() =>
        envoyerTous([auClientReservationEnregistree(recap), auComplexeNouvelleReservation(recap)])
      );
    }

    return {
      ok: true,
      reference,
      total: totalCents / 100,
      ...(paiement ? { urlPaiement: paiement.url } : {}),
    };
  } catch (e) {
    return enEchec(e);
  }
}

// ── Team building : demande de devis ─────────────────────────────────────────

export interface SaisieDevis {
  entreprise: string;
  contactNom: string;
  contactEmail: string;
  contactTelephone: string;
  dateSouhaitee: string;
  /** Depuis le 24 septembre 2026, la journée entière en plus des demi-journées. */
  periode: PeriodeTeamBuilding;
  nbParticipants: number;
  /**
   * Coordonnées de FACTURATION, facultatives.
   *
   * Elles ne l'étaient pas du tout auparavant : le formulaire public ne les
   * demandait pas, et l'exploitant devait les réclamer par téléphone avant de
   * pouvoir établir le devis — un aller-retour systématique sur chaque demande.
   *
   * Facultatives et non obligatoires, parce qu'une adresse complète et un
   * numéro de TVA exigés d'un prospect qui n'a pas encore vu un prix font
   * abandonner des demandes. Une société qui les a sous la main les donne ;
   * les autres passent. La fiche du back-office reste modifiable dans les deux
   * cas, elle a donc toujours le dernier mot.
   */
  clientAdresse?: string;
  clientTva?: string;
  message?: string;
  newsletter?: boolean;
  cgv: boolean;
}

export async function demanderDevis(saisie: SaisieDevis): Promise<Resultat> {
  try {
    verifierBase();

    const entreprise = texte(saisie?.entreprise, "Entreprise", { min: 2, max: 120 });
    const contactNom = texte(saisie?.contactNom, "Nom", { min: 2, max: 120 });
    const contactEmail = email(saisie?.contactEmail, "E-mail");
    const contactTelephone = telephone(saisie?.contactTelephone, "Téléphone");
    const dateSouhaitee = jour(saisie?.dateSouhaitee, "Date souhaitée");
    const message = texteFacultatif(saisie?.message, "Message", { max: 2000 });
    // Mêmes bornes que les champs équivalents du back-office, pour qu'une
    // saisie acceptée ici ne soit pas refusée là-bas.
    const clientAdresse = texteFacultatif(saisie?.clientAdresse, "Adresse", { max: 300 });
    const clientTva = texteFacultatif(saisie?.clientTva, "Numéro de TVA", { max: 40 });
    const nbParticipants = entier(saisie?.nbParticipants, "Nombre de participants", {
      min: TEAM_BUILDING_MIN_PARTICIPANTS,
      max: TEAM_BUILDING_MAX_PARTICIPANTS,
    });
    vrai(saisie?.cgv, "cgv", "Les conditions générales de vente doivent être acceptées.");
    const newsletterDevis = booleen(saisie?.newsletter);

    const periode = saisie?.periode;
    if (periode !== "matin" && periode !== "apres-midi" && periode !== "journee") {
      return { ok: false, message: "Choisissez un créneau.", champ: "periode" };
    }

    // Après le bornage, comme dans `reserverAnniversaire` : seules les
    // soumissions bien formées consomment une unité.
    if (await quotaDepasse("devis")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

    /*
      LE CRÉNEAU EST CHERCHÉ AVANT D'ÉCRIRE, ET TENU APRÈS.

      Depuis la migration 0036, une demande de team building TIENT son créneau.
      On regarde d'abord ce qui est libre pour ce jour et cette période : s'il
      n'y a rien, inutile d'écrire une demande qu'il faudrait aussitôt retirer.
      Le navigateur ne dit que « lundi matin » ; c'est ici qu'une Fun zone est
      attribuée — l'entreprise n'a aucune raison d'en préférer une.
    */
    const candidats = await candidatsTeamBuilding(dateSouhaitee, periode);
    if (candidats.length === 0) throw new CreneauDejaPris();

    const { id: demandeId, reference } = await enregistrerDemandeDevis({
      entreprise,
      contact_nom: contactNom,
      contact_email: contactEmail,
      contact_telephone: contactTelephone,
      date_souhaitee: dateSouhaitee,
      periode,
      nb_participants: nbParticipants,
      client_adresse: clientAdresse,
      client_tva: clientTva,
      message,
      newsletter: newsletterDevis,
      newsletter_le: newsletterDevis ? new Date().toISOString() : null,
      cgv_acceptees_le: new Date().toISOString(),
    });

    /*
      SI PLUS RIEN N'EST LIBRE AU MOMENT D'ÉCRIRE, LA DEMANDE EST RETIRÉE.

      Une autre entreprise peut avoir pris la dernière Fun zone entre la
      lecture et l'écriture. La demande n'a encore envoyé aucun e-mail : on la
      supprime, et le client est renvoyé au choix du créneau avec une liste
      relue — le même chemin que le perdant d'une course sur un anniversaire.
    */
    const tenus = await tenirCreneauxDevis(demandeId, candidats);
    if (!tenus) {
      await supprimerDemandeDevis(demandeId);
      throw new CreneauDejaPris();
    }

    const demande: DevisEmail = {
      reference,
      entreprise,
      contactNom,
      contactEmail,
      contactTelephone,
      dateSouhaitee: jourLisibleCap(new Date(`${dateSouhaitee}T12:00:00Z`)),
      periode: `${PERIODES[periode].label} · ${PERIODES[periode].debut} – ${PERIODES[periode].fin}`,
      nbParticipants,
      message,
      // Calculé par la même règle que celle qui garde les créneaux au
      // back-office, en heure de Bruxelles : pas d'heure recopiée ici.
      heurteSportFinder:
        conflitSurHeureLocale(
          jourISODeLaDate(dateSouhaitee),
          enMinutes(PERIODES[periode].debut),
          enMinutes(PERIODES[periode].fin) - enMinutes(PERIODES[periode].debut)
        ) !== null,
    };
    after(() => envoyerTous([auClientDevisRecu(demande), auComplexeNouveauDevis(demande)]));

    // Un devis n'a pas de montant : il sera chiffré par le complexe.
    return { ok: true, reference, total: 0 };
  } catch (e) {
    return enEchec(e);
  }
}
