"use server";

import { redirect } from "next/navigation";
import { verifierIdentifiants } from "@/lib/admin/identifiants";
import {
  adresseAppelant,
  backOfficeConfigure,
  fermerSession,
  journaliser,
  ouvrirSession,
  sessionCourante,
} from "@/lib/admin/session";
import { autoriser } from "@/lib/limiteur";

/**
 * Connexion et déconnexion du back-office.
 *
 * Aucun message ne distingue « utilisateur inconnu » de « mot de passe faux » :
 * cela indiquerait à qui cherche laquelle des deux valeurs il a trouvée.
 */

export interface EtatConnexion {
  erreur?: string;
}

/** Après cinq échecs, on fait patienter : une attaque par essais devient vaine. */
const MAX_TENTATIVES = 5;
const FENETRE_MS = 10 * 60 * 1000;

export async function seConnecter(
  _precedent: EtatConnexion,
  donnees: FormData
): Promise<EtatConnexion> {
  if (!backOfficeConfigure()) {
    return { erreur: "Le back-office n'est pas configuré sur cet environnement." };
  }

  const cle = `connexion:${(await adresseAppelant()) ?? "local"}`;
  if (!autoriser(cle, MAX_TENTATIVES, FENETRE_MS)) {
    return { erreur: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const utilisateur = String(donnees.get("utilisateur") ?? "").slice(0, 200);
  const motDePasse = String(donnees.get("motDePasse") ?? "").slice(0, 200);
  if (!utilisateur || !motDePasse) {
    return { erreur: "Identifiant et mot de passe sont requis." };
  }

  const acteur = await verifierIdentifiants(utilisateur, motDePasse);
  if (!acteur) return { erreur: "Identifiants incorrects." };

  await ouvrirSession(acteur);

  const session = await sessionCourante();
  if (session) await journaliser(session, "connexion", null);

  // `suite` vient du proxy et n'est jamais qu'un chemin interne à /admin ;
  // on le revérifie ici plutôt que de faire confiance au formulaire.
  const brut = String(donnees.get("suite") ?? "");
  const suite = brut.startsWith("/admin/") && !brut.startsWith("//") ? brut : "/admin";
  redirect(suite);
}

export async function seDeconnecter(): Promise<void> {
  const session = await sessionCourante();
  if (session) await journaliser(session, "deconnexion", null);
  await fermerSession();
  redirect("/admin/connexion");
}
