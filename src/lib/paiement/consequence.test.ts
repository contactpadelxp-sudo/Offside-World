import { describe, expect, it } from "vitest";
import { decrireConsequence, gesteADeuxMontants, type EtatFiche } from "./consequence";

/**
 * CE QUE L'ÉCRAN PROMET, ET CE QU'IL ENVOIE VRAIMENT.
 *
 * `montantARembourser` teste déjà la somme en centimes. Ici on teste le maillon
 * d'avant : la traduction d'une SITUATION choisie par l'exploitant en une
 * action et un choix de remboursement. Une erreur ici ne se voit pas — la somme
 * calculée plus loin sera parfaitement juste, mais pour la mauvaise règle.
 *
 * Deux pièges réels, trouvés en concevant cet écran, et que ces tests
 * verrouillent :
 *
 *  - fusionner « barème » en « intégral » quand les deux montants sont égaux.
 *    La page peut rester ouverte et franchir le seuil des 7 jours ; le serveur
 *    recalculerait alors 100 % là où le barème n'en prévoit plus que 50.
 *  - déduire le palier d'une égalité de montants. `baremeCents` est plafonné au
 *    reste, donc « barème = reste » survient aussi à trois jours sur une
 *    réservation déjà partiellement remboursée.
 */

/** L'espace insécable que `montantLisible` place avant le symbole. */
const NBSP = "\u00A0";

const CRENEAU = "le créneau du samedi 20 septembre à 15:00";

function etat(p: Partial<EtatFiche> = {}): EtatFiche {
  return {
    reste: 20000,
    bareme: 20000,
    montantGeste: null,
    sansArgent: false,
    creneau: CRENEAU,
    ...p,
  };
}

describe("la situation choisie décide de l'action, pas du montant", () => {
  it("« le client se désiste » annule et applique le barème", () => {
    const c = decrireConsequence("desistement", etat({ bareme: 10000 }));
    expect(c).toMatchObject({ action: "annuler", choix: "bareme" });
  });

  it("« c'est nous qui annulons » annule et rend tout", () => {
    const c = decrireConsequence("complexe", etat({ bareme: 10000 }));
    expect(c).toMatchObject({ action: "annuler", choix: "integral" });
  });

  it("« j'annule sans rien rendre » annule sans rembourser", () => {
    expect(decrireConsequence("rien", etat())).toMatchObject({
      action: "annuler",
      choix: "aucun",
    });
  });

  it("le geste commercial rembourse SANS annuler", () => {
    const c = decrireConsequence("geste", etat({ bareme: 20000 }));
    expect(c?.action).toBe("rembourser");
    // La phrase doit nommer le créneau conservé : c'est ce qui distingue ce
    // cas de l'annulation, et c'est le point que le client trouvait obscur.
    expect(c?.phrase).toContain(CRENEAU);
    expect(c?.phrase).toContain("n'est pas annulée");
  });
});

describe("on ne fusionne JAMAIS le barème dans l'intégral", () => {
  /*
    Le piège : à plus de 7 jours, barème et intégral valent tous deux le reste.
    Il serait tentant d'envoyer « integral » puisque la somme est la même. Ce
    serait faux — le serveur recalcule à partir de la date, et une page restée
    ouverte qui franchit le seuil ferait partir le double.
  */
  it("un désistement envoie « bareme » même quand il vaut le reste", () => {
    const c = decrireConsequence("desistement", etat({ bareme: 20000, reste: 20000 }));
    expect(c?.choix).toBe("bareme");
    expect(c?.choix).not.toBe("integral");
  });

  it("un désistement envoie « bareme » même quand il vaut zéro", () => {
    // À moins de 48 h. La tentation inverse — envoyer « aucun » — ferait
    // disparaître du journal le fait qu'un barème a été appliqué.
    const c = decrireConsequence("desistement", etat({ bareme: 0, reste: 20000 }));
    expect(c?.choix).toBe("bareme");
    expect(c?.choix).not.toBe("aucun");
  });

  it("une annulation du complexe n'envoie jamais « bareme »", () => {
    for (const bareme of [0, 10000, 20000]) {
      expect(decrireConsequence("complexe", etat({ bareme }))?.choix).toBe("integral");
    }
  });
});

describe("on ne nomme le délai que lorsqu'il est démontrable", () => {
  it("dit pourquoi rien n'est rendu quand le barème est à zéro et qu'il restait de l'argent", () => {
    // `bareme === 0` avec `reste > 0` impose une part nulle : moins de 48 h.
    // C'est le seul cas où la raison peut être écrite sans risque.
    const c = decrireConsequence("desistement", etat({ bareme: 0, reste: 20000 }));
    expect(c?.phrase).toContain("à cette date");
    expect(c?.phrase).toContain("ne prévoient plus de remboursement");
  });

  it("ne prétend jamais que l'activité est à plus de 7 jours", () => {
    /*
      Le cas qui piège : 200 € payés, 150 € déjà rendus. Le reste vaut 50 €, et
      le barème — plafonné au reste — vaut 50 € lui aussi, alors qu'on peut être
      à trois jours de l'activité. Toute phrase citant « plus de 7 jours »
      serait fausse.
    */
    const c = decrireConsequence("desistement", etat({ bareme: 5000, reste: 5000 }));
    expect(c?.phrase).not.toMatch(/7 jours/);
    expect(c?.phrase).not.toMatch(/48 h/);
    expect(c?.phrase).toContain("selon vos conditions d'annulation");
  });

  it("ne cite aucun délai dans les autres situations", () => {
    for (const s of ["complexe", "rien", "remb-partie", "remb-tout"] as const) {
      const c = decrireConsequence(s, etat({ bareme: 5000, reste: 5000 }));
      expect(c?.phrase).not.toMatch(/7 jours|48 h/);
    }
  });
});

describe("rien ne part sans un choix explicite", () => {
  it("aucune situation choisie : rien à valider", () => {
    expect(decrireConsequence(null, etat())).toBeNull();
  });

  it("un geste à deux montants attend qu'on en désigne un", () => {
    // 200 € restants, barème à 100 € : les deux sommes diffèrent, donc la
    // question se pose et le bouton doit rester inerte.
    const e = etat({ bareme: 10000, reste: 20000, montantGeste: null });
    expect(gesteADeuxMontants(e.bareme, e.reste)).toBe(true);
    expect(decrireConsequence("geste", e)).toBeNull();
  });

  it("une fois le montant désigné, le geste devient validable", () => {
    const e = etat({ bareme: 10000, reste: 20000, montantGeste: "bareme" });
    const c = decrireConsequence("geste", e);
    expect(c).toMatchObject({ action: "rembourser", choix: "bareme" });
    expect(c?.bouton).toContain("100");
  });

  it("un geste à un seul montant possible ne pose pas de question", () => {
    // Barème égal au reste : une seule somme est atteignable, il n'y a rien à
    // choisir. Poser la question ferait croire qu'il existe une alternative.
    const e = etat({ bareme: 20000, reste: 20000 });
    expect(gesteADeuxMontants(e.bareme, e.reste)).toBe(false);
    expect(decrireConsequence("geste", e)).toMatchObject({ choix: "integral" });
  });

  it("un geste avec un barème à zéro rend tout ce qui reste, pas rien", () => {
    // Le piège inverse : à moins de 48 h le barème vaut 0, mais un geste
    // commercial à 0 € n'est pas un geste. La seule somme sensée est le reste.
    const e = etat({ bareme: 0, reste: 20000 });
    expect(gesteADeuxMontants(e.bareme, e.reste)).toBe(false);
    const c = decrireConsequence("geste", e);
    expect(c?.choix).toBe("integral");
    expect(c?.bouton).toContain("200");
  });
});

describe("quand il n'y a pas d'argent, on ne pose pas de question d'argent", () => {
  it("annule directement, sans situation à choisir", () => {
    const c = decrireConsequence(null, etat({ sansArgent: true, reste: 0, bareme: 0 }));
    expect(c).toMatchObject({ action: "annuler", choix: "aucun", bouton: "Oui, annuler" });
  });

  it("ne prétend pas que les conditions d'annulation sont en cause", () => {
    /*
      Avec `reste === 0`, le barème vaut zéro quelle que soit la date puisqu'il
      est plafonné au reste. La phrase du désistement — « à cette date, vos
      conditions d'annulation ne prévoient plus de remboursement » — serait donc
      un mensonge ici. D'où le traitement séparé.
    */
    const c = decrireConsequence(null, etat({ sansArgent: true, reste: 0, bareme: 0 }));
    expect(c?.phrase).not.toMatch(/conditions d'annulation/);
    expect(c?.phrase).toContain("redevient libre à la vente");
  });

  it("l'emporte sur toute situation cochée", () => {
    // Garde-fou : un état résiduel ne doit pas ressusciter une question
    // d'argent sur une réservation où il n'y a plus rien à rendre.
    for (const s of ["desistement", "complexe", "geste", "rien"] as const) {
      const c = decrireConsequence(s, etat({ sansArgent: true, reste: 0, bareme: 0 }));
      expect(c?.choix).toBe("aucun");
      expect(c?.action).toBe("annuler");
    }
  });
});

describe("le bouton porte toujours le geste ET la somme", () => {
  it("écrit le montant quand de l'argent part", () => {
    expect(decrireConsequence("desistement", etat({ bareme: 10000 }))?.bouton).toBe(
      `Annuler et rendre 100${NBSP}€`
    );
    expect(decrireConsequence("complexe", etat({ reste: 18000 }))?.bouton).toBe(
      `Annuler et rendre 180${NBSP}€`
    );
    expect(decrireConsequence("remb-tout", etat({ reste: 4550 }))?.bouton).toBe(
      `Rendre 45,50${NBSP}€ au client`
    );
  });

  it("dit clairement quand rien ne part, plutôt qu'écrire « 0 € »", () => {
    // « Annuler et rendre 0 € » se lit comme un bug. On nomme l'absence.
    expect(decrireConsequence("rien", etat())?.bouton).toBe("Annuler sans rien rendre");
    expect(decrireConsequence("desistement", etat({ bareme: 0 }))?.bouton).toBe(
      "Annuler sans rien rendre"
    );
  });

  it("ne contient jamais deux montants différents", () => {
    // La phrase et le bouton doivent s'accorder : deux sommes à l'écran, c'est
    // l'occasion de valider la mauvaise.
    const cas: [Parameters<typeof decrireConsequence>[0], EtatFiche][] = [
      ["desistement", etat({ bareme: 10000, reste: 20000 })],
      ["complexe", etat({ bareme: 10000, reste: 20000 })],
      ["geste", etat({ bareme: 10000, reste: 20000, montantGeste: "integral" })],
      ["remb-partie", etat({ bareme: 10000, reste: 20000 })],
    ];
    for (const [s, e] of cas) {
      const c = decrireConsequence(s, e);
      const sommes = new Set([...(c?.phrase ?? "").matchAll(/(\d[\d  ,]*)\s?€/g)].map((m) => m[1].trim()));
      expect(sommes.size).toBeLessThanOrEqual(1);
    }
  });
});
