import { describe, expect, it } from "vitest";
import { enTexte, nettoyerCorps, versSlug } from "./nettoyage";

/**
 * Le corps d'un article est réinjecté tel quel dans la page publique
 * (`dangerouslySetInnerHTML`). Ce qui passe ce filtre s'exécute chez chaque
 * visiteur : c'est le seul endroit du projet où une faiblesse devient une
 * faille, et non un défaut d'affichage.
 *
 * Les cas ci-dessous ne sont pas hypothétiques — ce sont les charges qu'on
 * trouve en premier dans n'importe quel aide-mémoire XSS.
 */

/** Vrai si le résultat ne contient plus rien d'exécutable. */
function inoffensif(html: string): boolean {
  const s = html.toLowerCase();
  return (
    !s.includes("<script") &&
    !s.includes("javascript:") &&
    !s.includes("onerror") &&
    !s.includes("onload") &&
    !s.includes("onclick") &&
    !s.includes("<iframe") &&
    !s.includes("<object") &&
    !s.includes("<embed") &&
    !s.includes("<style")
  );
}

describe("nettoyage du corps d'un article", () => {
  it("garde la mise en forme que l'éditeur produit", () => {
    const html =
      "<h2>Titre</h2><p>Du <strong>gras</strong> et de l'<em>italique</em>.</p>" +
      "<ul><li>un</li><li>deux</li></ul><blockquote>Une citation.</blockquote>";
    const propre = nettoyerCorps(html);
    for (const balise of ["<h2>", "<strong>", "<em>", "<ul>", "<li>", "<blockquote>"]) {
      expect(propre).toContain(balise);
    }
  });

  it("retire les balises script", () => {
    const propre = nettoyerCorps('<p>Bonjour</p><script>alert("xss")</script>');
    expect(inoffensif(propre)).toBe(true);
    expect(propre).toContain("Bonjour");
  });

  it("retire les gestionnaires d'événements en attribut", () => {
    for (const charge of [
      '<img src="x" onerror="alert(1)">',
      '<p onclick="alert(1)">clic</p>',
      '<div onload="alert(1)">chargé</div>',
    ]) {
      expect(inoffensif(nettoyerCorps(charge))).toBe(true);
    }
  });

  it("retire les liens en javascript:", () => {
    const propre = nettoyerCorps('<a href="javascript:alert(1)">clic</a>');
    expect(inoffensif(propre)).toBe(true);
  });

  it("résiste aux variantes d'écriture du schéma javascript", () => {
    // Casse mélangée, espaces, tabulation : autant de contournements naïfs.
    for (const charge of [
      '<a href="JaVaScRiPt:alert(1)">a</a>',
      '<a href="  javascript:alert(1)">a</a>',
      '<a href="java\tscript:alert(1)">a</a>',
    ]) {
      const propre = nettoyerCorps(charge);
      expect(propre.toLowerCase()).not.toMatch(/javascript\s*:/);
    }
  });

  it("retire iframe, object, embed et style", () => {
    for (const charge of [
      '<iframe src="https://exemple.be"></iframe>',
      '<object data="x"></object>',
      "<embed src=\"x\">",
      "<style>body{display:none}</style>",
    ]) {
      expect(inoffensif(nettoyerCorps(charge))).toBe(true);
    }
  });

  it("laisse passer une image et un lien légitimes", () => {
    const propre = nettoyerCorps(
      '<p><a href="https://offsidefootindoor.be">Notre site</a></p>' +
        '<img src="https://exemple.be/photo.webp" alt="Un terrain">'
    );
    expect(propre).toContain("offsidefootindoor.be");
    expect(propre).toContain("<img");
    expect(propre).toContain('alt="Un terrain"');
  });

  it("ouvre les liens externes en sécurité", () => {
    // Sans `noopener`, la page ouverte peut reprendre la main sur celle du
    // complexe et la rediriger — le visiteur croit être resté sur le site.
    const propre = nettoyerCorps('<a href="https://exemple.be">ailleurs</a>');
    expect(propre).toContain('rel="noopener noreferrer nofollow"');
    expect(propre).toContain('target="_blank"');
  });

  it("laisse les liens internes tranquilles", () => {
    const propre = nettoyerCorps('<a href="/reservation">Réserver</a>');
    expect(propre).not.toContain('target="_blank"');
  });

  it("rétrograde un h1 en h2", () => {
    // `h1` est le titre de la page. Un second casserait la hiérarchie dont se
    // servent les lecteurs d'écran et les moteurs de recherche.
    const propre = nettoyerCorps("<h1>Faux titre</h1>");
    expect(propre).not.toContain("<h1");
    expect(propre).toContain("<h2");
  });

  it("est idempotent : renettoyer ne change plus rien", () => {
    // L'affichage public renettoie ce que la base renvoie. Si cette opération
    // n'était pas stable, un article changerait à chaque lecture.
    const html = '<h2>T</h2><p><a href="https://exemple.be">lien</a></p><script>x</script>';
    const une = nettoyerCorps(html);
    expect(nettoyerCorps(une)).toBe(une);
  });

  it("ne casse pas sur une entrée vide ou inhabituelle", () => {
    expect(nettoyerCorps("")).toBe("");
    expect(() => nettoyerCorps("<p>non fermée")).not.toThrow();
    expect(() => nettoyerCorps("<<<>>>")).not.toThrow();
  });
});

describe("extraction du texte", () => {
  it("retire toute balise", () => {
    expect(enTexte("<h2>Titre</h2><p>Corps <strong>gras</strong></p>")).toBe("Titre Corps gras");
  });

  it("coupe sur un mot entier", () => {
    const texte = enTexte("<p>" + "mot ".repeat(80) + "</p>", 20);
    expect(texte.length).toBeLessThanOrEqual(21);
    expect(texte.endsWith("…")).toBe(true);
    expect(texte).not.toMatch(/mo…$/);
  });

  it("ne coupe pas un texte déjà court", () => {
    expect(enTexte("<p>Court</p>", 200)).toBe("Court");
  });
});

describe("fabrication de l'adresse", () => {
  it("retire les accents au lieu des lettres", () => {
    expect(versSlug("Réservé aux enfants")).toBe("reserve-aux-enfants");
    expect(versSlug("Ça déménage à Gembloux")).toBe("ca-demenage-a-gembloux");
  });

  it("réduit la ponctuation à des tirets simples", () => {
    expect(versSlug("Bubble Foot : le guide !")).toBe("bubble-foot-le-guide");
    expect(versSlug("A   B")).toBe("a-b");
  });

  it("ne laisse jamais de tiret en tête ni en queue", () => {
    for (const t of ["!! Titre !!", "  espaces  ", "---a---"]) {
      const slug = versSlug(t);
      expect(slug.startsWith("-")).toBe(false);
      expect(slug.endsWith("-")).toBe(false);
    }
  });

  it("respecte la contrainte de la base", () => {
    // La colonne impose `^[a-z0-9]+(-[a-z0-9]+)*$` et 120 caractères : un slug
    // non conforme ferait échouer l'enregistrement, pas l'affichage.
    const forme = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const t of ["Titre normal", "Ça déménage !", "A".repeat(300), "Été 2027 — bilan"]) {
      const slug = versSlug(t);
      expect(slug.length).toBeLessThanOrEqual(120);
      expect(slug).toMatch(forme);
    }
  });
});
