"use client";

import { useCallback } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

/**
 * Éditeur visuel des articles.
 *
 * Visuel et non Markdown : Brahim écrit lui-même, et une syntaxe à retenir
 * est le meilleur moyen qu'un outil ne serve jamais. Ce qu'il voit à l'écran
 * est ce qui sera publié.
 *
 * L'éditeur produit du HTML, mais ce n'est PAS lui qui décide de ce qui est
 * autorisé : le corps est renettoyé côté serveur à l'enregistrement, et une
 * troisième fois à l'affichage public. Voir `src/lib/blog/nettoyage.ts`.
 */

const BOUTON =
  "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

function Outil({
  editeur,
  actif,
  onClick,
  titre,
  children,
}: {
  editeur: Editor;
  actif: boolean;
  onClick: () => void;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // `onMouseDown` et non `onClick` : cliquer déplacerait le curseur hors
      // du texte sélectionné, et la mise en forme s'appliquerait à rien.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
        editeur.commands.focus();
      }}
      aria-pressed={actif}
      title={titre}
      aria-label={titre}
      className={`${BOUTON} ${
        actif
          ? "bg-field/15 text-field"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function Editeur({
  valeur,
  onChange,
}: {
  valeur: string;
  onChange: (html: string) => void;
}) {
  const editeur = useEditor({
    // Obligatoire avec le rendu serveur de Next : sans ça, le premier rendu
    // du navigateur diffère de celui du serveur et React se plaint.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // `h1` est réservé au titre de la page : l'éditeur ne propose donc que
        // les niveaux inférieurs, ce qui garde une hiérarchie de titres juste.
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
    ],
    content: valeur,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-article min-h-64 w-full rounded-b-xl bg-input/30 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-field/60",
      },
    },
  });

  const poserLien = useCallback(() => {
    if (!editeur) return;
    const actuel = editeur.getAttributes("link").href as string | undefined;
    const saisi = window.prompt("Adresse du lien (vide pour retirer le lien)", actuel ?? "https://");
    if (saisi === null) return;
    if (saisi.trim() === "") {
      editeur.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editeur.chain().focus().extendMarkRange("link").setLink({ href: saisi.trim() }).run();
  }, [editeur]);

  const poserImage = useCallback(() => {
    if (!editeur) return;
    const src = window.prompt("Adresse de l'image (par exemple /images/bubble.jpg)");
    if (!src?.trim()) return;
    const alt = window.prompt("Décrivez l'image en quelques mots (pour les non-voyants)") ?? "";
    editeur.chain().focus().setImage({ src: src.trim(), alt: alt.trim() }).run();
  }, [editeur]);

  if (!editeur) {
    return (
      <div className="min-h-64 rounded-xl border border-border bg-input/30 px-4 py-3 text-sm text-muted-foreground">
        Chargement de l&apos;éditeur…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <Outil editeur={editeur} titre="Gras" actif={editeur.isActive("bold")}
          onClick={() => editeur.chain().toggleBold().run()}>
          <span className="font-bold">G</span>
        </Outil>
        <Outil editeur={editeur} titre="Italique" actif={editeur.isActive("italic")}
          onClick={() => editeur.chain().toggleItalic().run()}>
          <span className="italic">I</span>
        </Outil>

        <span className="mx-1 h-5 w-px bg-border" />

        <Outil editeur={editeur} titre="Titre de section" actif={editeur.isActive("heading", { level: 2 })}
          onClick={() => editeur.chain().toggleHeading({ level: 2 }).run()}>
          Titre
        </Outil>
        <Outil editeur={editeur} titre="Sous-titre" actif={editeur.isActive("heading", { level: 3 })}
          onClick={() => editeur.chain().toggleHeading({ level: 3 }).run()}>
          Sous-titre
        </Outil>

        <span className="mx-1 h-5 w-px bg-border" />

        <Outil editeur={editeur} titre="Liste à puces" actif={editeur.isActive("bulletList")}
          onClick={() => editeur.chain().toggleBulletList().run()}>
          Liste
        </Outil>
        <Outil editeur={editeur} titre="Liste numérotée" actif={editeur.isActive("orderedList")}
          onClick={() => editeur.chain().toggleOrderedList().run()}>
          1. Liste
        </Outil>
        <Outil editeur={editeur} titre="Citation" actif={editeur.isActive("blockquote")}
          onClick={() => editeur.chain().toggleBlockquote().run()}>
          Citation
        </Outil>

        <span className="mx-1 h-5 w-px bg-border" />

        <Outil editeur={editeur} titre="Lien" actif={editeur.isActive("link")} onClick={poserLien}>
          Lien
        </Outil>
        <Outil editeur={editeur} titre="Image" actif={false} onClick={poserImage}>
          Image
        </Outil>

        <span className="ml-auto flex items-center gap-1">
          <Outil editeur={editeur} titre="Annuler la dernière modification" actif={false}
            onClick={() => editeur.chain().undo().run()}>
            ↶
          </Outil>
          <Outil editeur={editeur} titre="Rétablir" actif={false}
            onClick={() => editeur.chain().redo().run()}>
            ↷
          </Outil>
        </span>
      </div>

      <EditorContent editor={editeur} />
    </div>
  );
}
