"use server";

import { headers } from "next/headers";
import { verifierCreneau } from "@/lib/db/creneaux";
import {
  lireTarifFormule,
  lireTarifsOptions,
} from "@/lib/db/referentiel";
import {
  CreneauDejaPris,
  enregistrerDemandeDevis,
  enregistrerReservation,
  expirerReservationsAbandonnees,
} from "@/lib/db/reservations";
import { autoriser } from "@/lib/limiteur";
import { baseConfiguree } from "@/lib/supabase/server";
import { SaisieInvalide, booleen, email, entier, identifiants, jour, telephone, texte, texteFacultatif, uuid, vrai } from "@/lib/saisie";
import {
  BUBBLE_MAX_PERSONNES,
  BUBBLE_MIN_PERSONNES,
  BUBBLE_PRIX_PAR_PERSONNE,
  TEAM_BUILDING_MAX_PARTICIPANTS,
  TEAM_BUILDING_MIN_PARTICIPANTS,
} from "@/data/bubble-team";

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
  | { ok: true; reference: string; total: number }
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

/** 5 écritures par tranche de 10 minutes et par appelant. */
async function quotaDepasse(action: string): Promise<boolean> {
  return !autoriser(`${action}:${await appelant()}`, 5, 10 * 60_000);
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
  remarques?: string;
  newsletter?: boolean;
  cgv: boolean;
}

export async function reserverAnniversaire(saisie: SaisieAnniversaire): Promise<Resultat> {
  try {
    verifierBase();
    if (await quotaDepasse("anniversaire")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

    // 1. Bornage de la saisie, avant toute requête.
    const creneauId = uuid(saisie?.creneauId, "Créneau");
    const formuleId = texte(saisie?.formuleId, "Formule", { max: 60 });
    const enfantPrenom = texte(saisie?.enfantPrenom, "Prénom de l'enfant", { min: 1, max: 60 });
    const enfantAge = entier(saisie?.enfantAge, "Âge de l'enfant", { min: 1, max: 17 });
    const optionsIds = identifiants(saisie?.optionsIds, "Options", 10);
    const clientNom = texte(saisie?.clientNom, "Nom", { min: 2, max: 120 });
    const clientEmail = email(saisie?.clientEmail, "E-mail");
    const clientTelephone = telephone(saisie?.clientTelephone, "Téléphone");
    const allergies = texteFacultatif(saisie?.allergies, "Allergies", { max: 500 });
    const remarques = texteFacultatif(saisie?.remarques, "Remarques", { max: 1000 });
    const newsletter = booleen(saisie?.newsletter);
    vrai(saisie?.cgv, "cgv", "Les conditions générales de vente doivent être acceptées.");

    // 2. Le référentiel décide du prix, et des bornes du nombre d'enfants.
    const formule = await lireTarifFormule(formuleId);
    if (!formule) return { ok: false, message: "Cette formule n'est plus proposée.", champ: "formule" };

    const nbEnfants = entier(saisie?.nbEnfants, "Nombre d'enfants", { min: 1, max: formule.enfantsMax });

    // 3. Le créneau est relu en base : type, ouverture, délai minimum, disponibilité.
    await expirerReservationsAbandonnees();
    const creneau = await verifierCreneau(creneauId, "anniversaire");
    if (!creneau) {
      return { ok: false, message: "Ce créneau n'est plus disponible.", champ: "creneau" };
    }
    if (nbEnfants > creneau.capacite) {
      return {
        ok: false,
        message: `Cet espace accueille ${creneau.capacite} enfants au maximum.`,
        champ: "nbEnfants",
      };
    }

    // 4. Les options doivent toutes exister et être actives ; sinon on refuse
    //    plutôt que d'ignorer silencieusement celle que le client croyait avoir.
    const tarifsOptions = await lireTarifsOptions(optionsIds);
    if (tarifsOptions.length !== optionsIds.length) {
      return { ok: false, message: "Une des options choisies n'est plus disponible.", champ: "options" };
    }

    // 5. Le total, en centimes entiers.
    const supplements = Math.max(0, nbEnfants - formule.enfantsInclus) * formule.prixEnfantSupCents;
    const optionsCents = tarifsOptions.reduce((somme, o) => somme + o.prixCents, 0);
    const totalCents = formule.prixBaseCents + supplements + optionsCents;

    const { reference } = await enregistrerReservation({
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
      cgv_acceptees_le: new Date().toISOString(),
      allergies,
      remarques,
    });

    return { ok: true, reference, total: totalCents / 100 };
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
    if (await quotaDepasse("bubble")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

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
    const totalCents = BUBBLE_PRIX_PAR_PERSONNE * 100 * nbPersonnes;

    const { reference } = await enregistrerReservation({
      type: "bubble",
      creneau_id: creneau.id,
      nb_personnes: nbPersonnes,
      total_cents: totalCents,
      client_nom: clientNom,
      client_email: clientEmail,
      client_telephone: clientTelephone,
      newsletter,
      cgv_acceptees_le: new Date().toISOString(),
      remarques,
    });

    return { ok: true, reference, total: totalCents / 100 };
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
  periode: "matin" | "apres-midi";
  nbParticipants: number;
  message?: string;
  newsletter?: boolean;
  cgv: boolean;
}

export async function demanderDevis(saisie: SaisieDevis): Promise<Resultat> {
  try {
    verifierBase();
    if (await quotaDepasse("devis")) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }

    const entreprise = texte(saisie?.entreprise, "Entreprise", { min: 2, max: 120 });
    const contactNom = texte(saisie?.contactNom, "Nom", { min: 2, max: 120 });
    const contactEmail = email(saisie?.contactEmail, "E-mail");
    const contactTelephone = telephone(saisie?.contactTelephone, "Téléphone");
    const dateSouhaitee = jour(saisie?.dateSouhaitee, "Date souhaitée");
    const message = texteFacultatif(saisie?.message, "Message", { max: 2000 });
    const nbParticipants = entier(saisie?.nbParticipants, "Nombre de participants", {
      min: TEAM_BUILDING_MIN_PARTICIPANTS,
      max: TEAM_BUILDING_MAX_PARTICIPANTS,
    });
    vrai(saisie?.cgv, "cgv", "Les conditions générales de vente doivent être acceptées.");

    const periode = saisie?.periode;
    if (periode !== "matin" && periode !== "apres-midi") {
      return { ok: false, message: "Choisissez une demi-journée.", champ: "periode" };
    }

    const { reference } = await enregistrerDemandeDevis({
      entreprise,
      contact_nom: contactNom,
      contact_email: contactEmail,
      contact_telephone: contactTelephone,
      date_souhaitee: dateSouhaitee,
      periode,
      nb_participants: nbParticipants,
      message,
      newsletter: booleen(saisie?.newsletter),
      cgv_acceptees_le: new Date().toISOString(),
    });

    // Un devis n'a pas de montant : il sera chiffré par le complexe.
    return { ok: true, reference, total: 0 };
  } catch (e) {
    return enEchec(e);
  }
}
