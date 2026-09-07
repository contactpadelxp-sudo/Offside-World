import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Nettoyage du HTML des articles.
 *
 * POURQUOI CE FICHIER EXISTE. Le corps d'un article est réinjecté tel quel
 * dans la page publique (`dangerouslySetInnerHTML`) : c'est le seul moyen
 * d'afficher du texte mis en forme. Sans nettoyage, une balise `<script>`
 * arrivée jusqu'à la base s'exécuterait chez chaque visiteur.
 *
 * On ne fait donc confiance à personne :
 *   - pas à l'éditeur, qui tourne dans le navigateur et peut être contourné ;
 *   - pas à la base, dont le contenu est nettoyé À NOUVEAU à l'affichage.
 * Le nettoyage a lieu à l'écriture ET à la lecture. C'est volontairement
 * redondant : le jour où un article entre par un autre chemin — import,
 * correction en SQL, restauration de sauvegarde — la page publique reste sûre.
 *
 * On n'écrit pas notre propre nettoyeur : c'est un exercice où l'on se trompe,
 * et où l'erreur ne se voit pas. `sanitize-html` fait ce travail.
 */

/**
 * Ce que l'éditeur visuel sait produire, et rien d'autre.
 * Pas de `<style>`, pas de `<iframe>`, pas d'attribut d'événement — la liste
 * est blanche, donc tout ce qui n'y figure pas disparaît sans discussion.
 */
const REGLES: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "s", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title"],
  },
  // `mailto` et `tel` sont utiles dans un article ; `javascript:` ne l'est
  // jamais et c'est précisément le schéma qu'on écarte ici.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Une image en `data:` peut être énorme ; on la laisse passer parce que
  // l'éditeur peut en produire, mais la taille du corps est bornée en base.
  transformTags: {
    // Un lien vers l'extérieur s'ouvre dans un nouvel onglet, et `noopener`
    // empêche la page ouverte de reprendre la main sur celle du complexe.
    a: (nomBalise, attribs) => {
      const href = attribs.href ?? "";
      const externe = /^https?:\/\//i.test(href);
      return {
        tagName: nomBalise,
        attribs: externe
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" }
          : attribs,
      };
    },
    // `h1` est réservé au titre de la page : un article qui en contiendrait un
    // second casserait la hiérarchie des titres, ce que les lecteurs d'écran
    // et les moteurs de recherche utilisent pour se repérer.
    h1: "h2",
  },
  // Une balise vide laissée par l'éditeur ne doit pas creuser un trou dans
  // la page — sauf `<br>` et `<hr>`, qui sont vides par nature.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

/** Nettoie le corps d'un article. À appeler à l'écriture ET à l'affichage. */
export function nettoyerCorps(html: string): string {
  return sanitizeHtml(html, REGLES);
}

/**
 * Réduit du HTML à son texte, pour le chapô automatique et les métadonnées de
 * partage — où une balise s'afficherait telle quelle.
 */
export function enTexte(html: string, max = 200): string {
  const texte = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  if (texte.length <= max) return texte;
  // Coupe sur un mot entier plutôt qu'en plein milieu.
  const coupe = texte.slice(0, max);
  const espace = coupe.lastIndexOf(" ");
  return `${espace > max * 0.6 ? coupe.slice(0, espace) : coupe}…`;
}

/**
 * Fabrique l'identifiant d'URL à partir du titre.
 * La règle vit dans `slug-client.ts`, qui n'est pas `server-only` : l'éditeur
 * l'affiche pendant la frappe, le serveur la recalcule à l'enregistrement.
 */
export { versSlugClient as versSlug } from "./slug-client";
