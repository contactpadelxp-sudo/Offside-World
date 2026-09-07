"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Editeur } from "@/components/admin/editeur";
import { enregistrerArticle, supprimerArticle, televerserImage } from "@/lib/actions/blog";
import { preparerImage } from "@/lib/blog/image-client";
import type { ArticleComplet } from "@/lib/db/blog";
import { versSlugClient } from "@/lib/blog/slug-client";
import {
  BOUTON_DANGER,
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";

/**
 * Rédaction d'un article.
 *
 * Deux partis pris, tous deux pour la même raison — l'auteur n'est pas
 * développeur :
 *
 * 1. L'ADRESSE SE DÉDUIT DU TITRE tant qu'on n'y a pas touché. Personne ne
 *    devrait avoir à comprendre ce qu'est un « slug » pour publier. Dès qu'elle
 *    est modifiée à la main, elle cesse de suivre : on ne réécrit pas par
 *    surprise l'adresse d'un article déjà partagé.
 * 2. PUBLIER EST UNE CASE, PAS UN BOUTON À PART. Écrire, relire, cocher.
 *    Décocher republie en brouillon sans rien perdre.
 */

const CHAMP =
  "w-full rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60";
const ETIQUETTE = "mb-1 block text-xs text-muted-foreground";

/** Date ISO -> valeur attendue par un champ `datetime-local`, en heure locale. */
function versChampDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function FormulaireArticle({ a }: { a: ArticleComplet }) {
  const router = useRouter();
  const { enCours, occupe, retour, lancer } = useAction();
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const champCouverture = useRef<HTMLInputElement>(null);
  const [envoiCouverture, setEnvoiCouverture] = useState<string | null>(null);

  /** Dépose la photo de couverture. Même chemin que dans l'éditeur. */
  const deposerCouverture = async (fichier: File) => {
    setEnvoiCouverture("Envoi…");
    try {
      const pret = await preparerImage(fichier);
      const donnees = new FormData();
      donnees.append("fichier", pret);
      const r = await televerserImage(donnees);
      if (r.ok && r.url) {
        setV((p) => ({ ...p, image: r.url as string }));
        setEnvoiCouverture(null);
      } else {
        setEnvoiCouverture(r.message ?? "L'envoi a échoué.");
      }
    } catch {
      setEnvoiCouverture("L'envoi a échoué. Réessayez.");
    }
  };

  const [v, setV] = useState({
    titre: a.titre,
    slug: a.slug,
    chapo: a.chapo === "" ? "" : a.chapo,
    corps: a.corps,
    image: a.image ?? "",
    publie: a.publie,
    publieLe: versChampDate(a.publieLe),
  });

  // Tant que l'auteur n'a pas touché à l'adresse, elle suit le titre.
  const [slugManuel, setSlugManuel] = useState(a.slug !== "nouvel-article" && a.titre !== "Nouvel article");

  const majTitre = (titre: string) =>
    setV((p) => ({ ...p, titre, slug: slugManuel ? p.slug : versSlugClient(titre) }));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div>
          <label className={ETIQUETTE} htmlFor="titre">Titre</label>
          <input
            id="titre"
            className={`${CHAMP} text-lg font-bold`}
            value={v.titre}
            maxLength={160}
            onChange={(e) => majTitre(e.target.value)}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={ETIQUETTE} htmlFor="slug">
              Adresse de la page — offsidefootindoor.be/blog/<strong>{v.slug || "…"}</strong>
            </label>
            <input
              id="slug"
              className={CHAMP}
              value={v.slug}
              maxLength={120}
              onChange={(e) => {
                setSlugManuel(true);
                setV({ ...v, slug: e.target.value });
              }}
            />
          </div>
          <div>
            <label className={ETIQUETTE} htmlFor="image">
              Image de couverture — facultative
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => champCouverture.current?.click()}
                className={BOUTON_NEUTRE}
              >
                {v.image ? "Remplacer" : "Choisir une image"}
              </button>
              {v.image && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.image} alt="" className="h-10 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setV({ ...v, image: "" })}
                    className={BOUTON_NEUTRE}
                  >
                    Retirer
                  </button>
                </>
              )}
            </div>
            <input
              ref={champCouverture}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void deposerCouverture(f);
              }}
            />
            {envoiCouverture && (
              <p className="mt-1 text-xs text-muted-foreground">{envoiCouverture}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className={ETIQUETTE} htmlFor="chapo">
            Résumé — affiché dans la liste et lors du partage. Laissé vide, on prend le début de
            l&apos;article.
          </label>
          <textarea
            id="chapo"
            className={CHAMP}
            rows={2}
            value={v.chapo}
            maxLength={400}
            onChange={(e) => setV({ ...v, chapo: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className={ETIQUETTE}>Article</p>
        <Editeur valeur={a.corps} onChange={(corps) => setV((p) => ({ ...p, corps }))} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              checked={v.publie}
              onChange={(e) => setV({ ...v, publie: e.target.checked })}
              className="size-5 accent-[var(--color-field)]"
            />
            Visible sur le site
          </label>

          <div>
            <label className={ETIQUETTE} htmlFor="publieLe">
              Date affichée — vide, on met celle de la publication
            </label>
            <input
              id="publieLe"
              type="datetime-local"
              className={CHAMP}
              value={v.publieLe}
              onChange={(e) => setV({ ...v, publieLe: e.target.value })}
            />
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {v.publie
            ? "Cet article est lisible par tout le monde dès l'enregistrement."
            : "Brouillon : personne d'autre que vous ne peut le voir."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={enCours}
            onClick={() => lancer("enregistrer", () => enregistrerArticle(a.id, v))}
            className={BOUTON_PRINCIPAL}
          >
            {occupe("enregistrer") && <Rotative />}
            Enregistrer
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className={BOUTON_NEUTRE}
          >
            Retour à la liste
          </button>

          {confirmeSuppression ? (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5">
              <span className="text-sm text-destructive">Supprimer définitivement ?</span>
              <button
                type="button"
                disabled={enCours}
                onClick={() => {
                  setConfirmeSuppression(false);
                  lancer("supprimer", async () => {
                    const r = await supprimerArticle(a.id);
                    if (r.ok) router.push("/admin/blog");
                    return r;
                  });
                }}
                className={BOUTON_DANGER}
              >
                Oui, supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmeSuppression(false)}
                className={BOUTON_NEUTRE}
              >
                Non
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={enCours}
              onClick={() => setConfirmeSuppression(true)}
              className={`${BOUTON_NEUTRE} ml-auto`}
            >
              Supprimer
            </button>
          )}
        </div>

        <MessageAction retour={retour} />
      </div>
    </div>
  );
}
