import { describe, expect, it } from "vitest";
import {
  SaisieInvalide,
  booleen,
  email,
  entier,
  identifiants,
  telephone,
  texte,
  texteFacultatif,
  uuid,
  vrai,
} from "./saisie";

/**
 * La porte d'entrée du site : tout ce qu'un visiteur envoie passe par ici
 * avant d'atteindre la base.
 *
 * Ces fonctions sont appelées depuis des Server Actions, c'est-à-dire des URL
 * publiques appelables directement, sans passer par le formulaire. Le
 * navigateur ne filtre donc RIEN de garanti : les cas ci-dessous décrivent ce
 * qu'un appel construit à la main peut contenir.
 */

/** Vrai si l'appel refuse la valeur, plutôt que de l'accepter en la déformant. */
function refuse(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof SaisieInvalide;
  }
}

describe("texte", () => {
  it("accepte une saisie normale et retire les espaces autour", () => {
    expect(texte("  Amélie Vandenberghe  ", "Nom")).toBe("Amélie Vandenberghe");
  });

  it("retire les caractères de contrôle", () => {
    // Ils ne s'affichent pas mais peuvent casser un e-mail, un CSV exporté,
    // ou masquer du texte dans le back-office.
    expect(texte("Jean\u0000Dupont", "Nom")).toBe("JeanDupont");
    expect(texte("A\u001fB", "Nom")).toBe("AB");
  });

  it("retire les séparateurs de ligne Unicode", () => {
    // U+2028 et U+2029 cassent l'exécution de code JavaScript qui les inclut
    // sans échappement — un vecteur classique et discret.
    expect(texte("a\u2028b", "Nom")).toBe("ab");
    expect(texte("a\u2029b", "Nom")).toBe("ab");
  });

  it("refuse ce qui n'est pas du texte", () => {
    for (const v of [42, null, undefined, {}, [], true]) {
      expect(refuse(() => texte(v, "Nom"))).toBe(true);
    }
  });

  it("refuse une saisie vide ou faite uniquement d'espaces", () => {
    expect(refuse(() => texte("", "Nom"))).toBe(true);
    expect(refuse(() => texte("   ", "Nom"))).toBe(true);
  });

  it("refuse au-delà de la longueur maximale", () => {
    expect(refuse(() => texte("a".repeat(201), "Nom"))).toBe(true);
    expect(texte("a".repeat(200), "Nom").length).toBe(200);
  });

  it("refuse une saisie démesurée avant même de la nettoyer", () => {
    // Le plafond absolu évite de dépenser du temps processeur à assainir
    // un mégaoctet envoyé exprès.
    expect(refuse(() => texte("a".repeat(1_000_000), "Nom"))).toBe(true);
  });

  it("ne garde les sauts de ligne que si on les autorise", () => {
    expect(texte("a\nb", "Note")).toBe("ab");
    expect(texte("a\nb", "Note", { sauts: true })).toBe("a\nb");
  });
});

describe("texteFacultatif", () => {
  it("traite l'absence comme une absence, pas comme une erreur", () => {
    for (const v of [null, undefined, "", "   "]) {
      expect(texteFacultatif(v, "Remarques")).toBeNull();
    }
  });

  it("garde une valeur présente", () => {
    expect(texteFacultatif("Allergie aux arachides", "Allergies")).toBe(
      "Allergie aux arachides"
    );
  });
});

describe("entier", () => {
  it("accepte un nombre dans les bornes", () => {
    expect(entier(12, "Enfants", { min: 1, max: 20 })).toBe(12);
    expect(entier("12", "Enfants", { min: 1, max: 20 })).toBe(12);
  });

  it("refuse hors des bornes", () => {
    // Sans cette borne, un appel direct pourrait réserver pour 900 enfants.
    expect(refuse(() => entier(21, "Enfants", { min: 1, max: 20 }))).toBe(true);
    expect(refuse(() => entier(0, "Enfants", { min: 1, max: 20 }))).toBe(true);
    expect(refuse(() => entier(-5, "Enfants", { min: 1, max: 20 }))).toBe(true);
  });

  it("refuse ce qui n'est pas un entier", () => {
    for (const v of [1.5, "abc", NaN, Infinity, null, {}]) {
      expect(refuse(() => entier(v, "Enfants", { min: 1, max: 20 }))).toBe(true);
    }
  });
});

describe("cases à cocher", () => {
  it("n'accepte QUE `true` pour une case obligatoire", () => {
    // Les CGV : « on » ou 1 ne valent pas un consentement.
    expect(vrai(true, "cgv", "CGV")).toBe(true);
    for (const v of ["true", "on", 1, {}, null, undefined, false]) {
      expect(refuse(() => vrai(v, "cgv", "CGV"))).toBe(true);
    }
  });

  it("traite tout le reste comme « non » pour une case facultative", () => {
    expect(booleen(true)).toBe(true);
    for (const v of ["true", 1, {}, null, undefined, false]) {
      expect(booleen(v)).toBe(false);
    }
  });
});

describe("e-mail", () => {
  it("accepte une adresse valide et la met en minuscules", () => {
    expect(email("Amelie.V@Exemple.BE", "E-mail")).toBe("amelie.v@exemple.be");
  });

  it("refuse une adresse invalide", () => {
    for (const v of ["pasunemail", "a@", "@b.be", "a b@c.be", ""]) {
      expect(refuse(() => email(v, "E-mail"))).toBe(true);
    }
  });
});

describe("téléphone", () => {
  it("accepte un numéro belge au format international", () => {
    expect(telephone("+32470112233", "Téléphone")).toBe("+32470112233");
  });

  it("refuse ce qui n'est pas un numéro", () => {
    for (const v of ["abc", "123", "", "+"]) {
      expect(refuse(() => telephone(v, "Téléphone"))).toBe(true);
    }
  });
});

describe("uuid", () => {
  it("accepte un identifiant valide et le met en minuscules", () => {
    expect(uuid("AAAAAAAA-1111-4111-8111-111111111111", "Créneau")).toBe(
      "aaaaaaaa-1111-4111-8111-111111111111"
    );
  });

  it("refuse tout le reste", () => {
    for (const v of [
      "pas-un-uuid",
      "aaaaaaaa-1111-4111-8111-11111111111",
      "aaaaaaaa11114111811111111111111z",
      "",
      42,
    ]) {
      expect(refuse(() => uuid(v, "Créneau"))).toBe(true);
    }
  });
});

describe("liste d'identifiants", () => {
  it("fusionne les doublons", () => {
    // Sans quoi la même option serait facturée deux fois.
    expect(identifiants(["photo", "photo", "pinata"], "Options")).toEqual(["photo", "pinata"]);
  });

  it("accepte une liste vide", () => {
    expect(identifiants([], "Options")).toEqual([]);
    expect(identifiants(undefined, "Options")).toEqual([]);
  });

  it("refuse une liste démesurée", () => {
    const trop = Array.from({ length: 200 }, (_, i) => `opt${i}`);
    expect(refuse(() => identifiants(trop, "Options"))).toBe(true);
  });
});
