import { describe, expect, it } from "vitest";
import { decrireAction, lienJournal } from "./journal";

/**
 * L'espace INSÉCABLE que `montantLisible` place avant le symbole, pour que le
 * montant ne soit jamais coupé de son euro en fin de ligne. Écrite en clair
 * ici : la même chaîne avec une espace ordinaire passerait pour identique à
 * l'œil et ferait échouer le test sans qu'on voie pourquoi.
 */
const NBSP = "\u00A0";

/**
 * CE QUE L'EXPLOITANT LIT DANS SON JOURNAL.
 *
 * Le journal est une obligation avant d'être un confort : les réservations
 * portent des données d'enfants et de santé, et savoir qui a fait quoi en fait
 * partie (RGPD art. 5.1.f et 32). Une ligne illisible est une ligne inutile.
 *
 * Les `detail` employés ici ne sont pas inventés : ce sont les formes
 * réellement écrites en base, relevées le 15 septembre 2026.
 */

describe("le détail devient une phrase", () => {
  it("dit combien valait le devis envoyé", () => {
    // Sans ça, « Devis envoyé au client » ne distinguait pas 180 € de 1 800 €.
    expect(decrireAction("devis.envoye", { montant_cents: 18000 })).toMatchObject({
      libelle: "Devis envoyé au client",
      famille: "devis",
      precision: `180${NBSP}€`,
    });
  });

  it("dit si le client a été remboursé en annulant", () => {
    expect(decrireAction("reservation.annulee", { remboursement: "aucun" }).precision).toBe(
      "sans remboursement"
    );
    expect(decrireAction("reservation.annulee", { remboursement: "integral" }).precision).toBe(
      "remboursement intégral"
    );
    expect(decrireAction("reservation.annulee", { remboursement: "bareme" }).precision).toBe(
      "remboursement selon le barème"
    );
  });

  it("traduit les statuts de devis, qui sont écrits en clés", () => {
    expect(decrireAction("devis.statut", { statut: "acceptee" }).precision).toBe(
      "accepté par le client"
    );
    expect(decrireAction("devis.statut", { statut: "nouvelle" }).precision).toBe(
      "remis en « nouvelle »"
    );
  });

  it("résume une formule modifiée par son prix et sa mise en ligne", () => {
    const r = decrireAction("formule.modifiee", {
      actif: false,
      prix_base_cents: 29000,
      prix_enfant_sup_cents: 1500,
    });
    expect(r.precision).toBe(`290${NBSP}€ · retirée du site`);
    expect(r.famille).toBe("catalogue");
  });

  it("montre le montant réellement rendu sur un remboursement", () => {
    expect(decrireAction("paiement.rembourse", { montant_cents: 10000 }).precision).toBe(
      `100${NBSP}€`
    );
  });
});

describe("ce qui n'a rien à dire ne dit rien", () => {
  it("ne met pas de précision quand le détail est absent", () => {
    expect(decrireAction("connexion", null).precision).toBeNull();
    expect(decrireAction("reservation.confirmee", null).precision).toBeNull();
  });

  it("n'écrit jamais « [object Object] » sur un détail inattendu", () => {
    /*
      La colonne est un `jsonb` : elle peut contenir autre chose qu'un objet.

      HONNÊTETÉ SUR CE QUE CE TEST VERROUILLE. Il fixe le RÉSULTAT, pas le
      garde-fou. Vérifié en cassant le code exprès : retirer le filtre
      `typeof === "object"` de `decrireAction` ne fait pas tomber ce test,
      parce que chaque fonction `precision` sait déjà se taire quand la clé
      qu'elle cherche est absente. Les deux protections se recouvrent.

      Le test reste utile — c'est la sortie visible par l'exploitant qu'il
      empêche de régresser — mais il ne faut pas croire qu'il protège le
      filtre : celui-ci n'est aujourd'hui couvert par rien.
    */
    for (const bizarre of ["texte", 42, true, [1, 2], null, undefined]) {
      expect(decrireAction("devis.envoye", bizarre).precision).toBeNull();
    }
  });

  it("ignore un montant illisible plutôt que d'afficher « NaN € »", () => {
    expect(decrireAction("devis.envoye", { montant_cents: "beaucoup" }).precision).toBeNull();
    expect(decrireAction("devis.envoye", {}).precision).toBeNull();
  });

  it("ignore un statut de devis inconnu", () => {
    expect(decrireAction("devis.statut", { statut: "inventé" }).precision).toBeNull();
  });
});

describe("une action inconnue reste visible", () => {
  /*
    C'est le point important. Un journal qui masque ce qu'il ne sait pas nommer
    ne vaut plus rien : la ligne qu'on cherchera un jour est justement celle
    qui n'était pas prévue. Une action ajoutée au code sans être décrite ici
    doit donc s'afficher quand même, avec sa clé brute.
  */
  it("garde sa clé pour libellé", () => {
    expect(decrireAction("chose.inattendue", null)).toMatchObject({
      libelle: "chose.inattendue",
      precision: null,
    });
  });

  it("la range dans « connexions » plutôt que de la perdre", () => {
    // Les onglets filtrent par famille : sans famille, la ligne n'apparaîtrait
    // dans aucun onglet et serait invisible partout sauf dans « Tout ».
    expect(decrireAction("chose.inattendue", null).famille).toBe("acces");
  });
});

describe("les deux notes internes ne se confondent plus", () => {
  it("distingue la note d'une réservation de celle d'un devis", () => {
    const r = decrireAction("reservation.note", null);
    const d = decrireAction("devis.note", null);
    expect(r.libelle).not.toBe(d.libelle);
    expect(r.famille).toBe("reservations");
    expect(d.famille).toBe("devis");
  });
});

describe("les liens mènent quelque part, ou n'existent pas", () => {
  it("mène à la fiche de la réservation, que la recherche retrouve", () => {
    expect(lienJournal("reservation.annulee", "OW-JRUMAL8Y")).toBe("/admin?q=OW-JRUMAL8Y");
    expect(lienJournal("paiement.rembourse", "OW-AZEG8RV6")).toBe("/admin?q=OW-AZEG8RV6");
  });

  it("mène à la liste COMPLÈTE des devis, celle où la demande figure", () => {
    // La liste par défaut masque les demandes closes, et la plupart des lignes
    // du journal en concernent une : sans `toutes=1`, le lien arriverait sur
    // une page où la cible n'apparaît pas.
    expect(lienJournal("devis.envoye", "TB-2XD5YCL7")).toBe("/admin/devis?toutes=1");
  });

  it("ne fabrique pas de lien là où il n'y a pas de fiche à ouvrir", () => {
    expect(lienJournal("formule.modifiee", "bubble")).toBeNull();
    expect(lienJournal("email.test", "brahim@example.be")).toBeNull();
    expect(lienJournal("connexion", null)).toBeNull();
  });

  it("n'invente pas de lien sans cible", () => {
    expect(lienJournal("reservation.annulee", null)).toBeNull();
  });

  it("échappe une référence qui contiendrait un caractère d'URL", () => {
    expect(lienJournal("reservation.note", "OW A&B")).toBe("/admin?q=OW%20A%26B");
  });
});

describe("une journée fermée dit laquelle", () => {
  it("rend la date lisible plutôt que son format ISO", () => {
    const d = decrireAction("creneaux.journee_fermee", { jour: "2026-12-25", creneaux: 6 });
    expect(d.libelle).toBe("Journée fermée");
    expect(d.famille).toBe("catalogue");
    // La date sous les yeux de l'exploitant, pas « 2026-12-25 ».
    expect(d.precision).toContain("décembre");
    expect(d.precision).toContain("6 créneaux");
  });

  it("distingue une fermeture d'une réouverture", () => {
    const f = decrireAction("creneaux.journee_fermee", { jour: "2027-01-01" });
    const o = decrireAction("creneaux.journee_ouverte", { jour: "2027-01-01" });
    expect(f.libelle).not.toBe(o.libelle);
  });

  it("accorde le singulier", () => {
    const d = decrireAction("creneaux.journee_fermee", { jour: "2026-12-25", creneaux: 1 });
    expect(d.precision).toContain("1 créneau");
    expect(d.precision).not.toContain("créneaux");
  });

  it("n'invente rien quand le détail est absent ou inutilisable", () => {
    // Une ligne ancienne, ou un détail tronqué : mieux vaut pas de précision
    // qu'une date fausse. C'est l'écran qu'on rouvre quand un client conteste.
    expect(decrireAction("creneaux.journee_fermee", null).precision).toBeNull();
    expect(decrireAction("creneaux.journee_fermee", { jour: "25/12/2026" }).precision).toBeNull();
    expect(decrireAction("creneaux.journee_fermee", { jour: "2026-13-45" }).precision).toBeNull();
  });

  it("omet le nombre plutôt que d'afficher « 0 créneau »", () => {
    const d = decrireAction("creneaux.journee_fermee", { jour: "2026-12-25", creneaux: 0 });
    expect(d.precision).not.toContain("0");
  });
});

describe("les actions du blog ne sortent plus sous leur clé technique", () => {
  it("traduit les quatre, et les range dans le catalogue", () => {
    for (const cle of ["article.enregistre", "article.publie", "article.supprime", "article.image"]) {
      const d = decrireAction(cle, null);
      expect(d.libelle).not.toBe(cle);
      // Sans entrée, la famille retombait sur « acces » : une suppression
      // d'article se rangeait à côté des connexions.
      expect(d.famille).toBe("catalogue");
    }
  });

  it("dit qu'un article a été remis en brouillon", () => {
    expect(decrireAction("article.publie", { publie: false }).precision).toBe("remis en brouillon");
    expect(decrireAction("article.publie", { publie: true }).precision).toBeNull();
  });
});
