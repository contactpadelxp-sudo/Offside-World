import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/photo";
import { Ballon, Calendrier, Enveloppe, FlecheDroite, Gateau, Horloge } from "@/components/icons";
import { BOUNCE_PARK, BOUNCE_PARK_HORAIRES } from "@/data/bounce-park";
import { hrefActivite } from "@/data/activites";
import { ADRESSE, EMAIL, NOM_COMMERCIAL } from "@/data/entreprise";
import { resolvePhotos } from "@/lib/photos";
import { metadonneesPage } from "@/lib/site";

/**
 * Le Bounce Park, présenté avant son ouverture.
 *
 * Demandé par Brahim le 25 septembre 2026 : que la carte « Bientôt » de
 * l'accueil mène quelque part, et que ce quelque part explique ce qu'est le
 * parc — sur le modèle de la page « Bounce Arena » d'Owaza.
 *
 * CE QUE LA PAGE DIT, ET CE QU'ELLE TAIT. Tout ce qui est écrit ici est connu :
 * la date d'ouverture (Brahim, 24 septembre 2026), les horaires prévus
 * (Brahim, 21 septembre 2026) et ce que montre le visuel du projet. Le prix et
 * l'âge minimum ne le sont pas — ils sont annoncés comme « à venir », jamais
 * devinés. C'est la règle qui a fait retirer « dès 6 ans » de l'accueil.
 *
 * LE SEUL VISUEL EST UN RENDU 3D, pas une photo : la légende le dit, pour que
 * personne ne s'étonne le jour J d'un détail qui aurait bougé.
 *
 * LES TEXTES SONT ÉCRITS ICI. Mathis a transmis ceux d'Owaza comme idées —
 * public visé, trampoline et parcours d'obstacles, « plutôt que les écrans » —
 * en demandant de tout reformuler : c'est un concurrent. Aucune phrase n'en
 * est reprise. Les « toboggans » de leur texte n'y figurent pas : rien ne
 * permet de dire, sur notre visuel, que ce parc-ci en a.
 */

export const metadata: Metadata = metadonneesPage({
  titre: `Bounce Park — parc gonflable à Gembloux, ouverture le ${BOUNCE_PARK.ouverture} | ${NOM_COMMERCIAL}`,
  description: `Un immense terrain de jeu gonflable arrive au complexe ${NOM_COMMERCIAL} de Gembloux : grimper, ramper, sauter, en famille, entre amis ou entre collègues. Ouverture le ${BOUNCE_PARK.ouverture}.`,
  chemin: "/bounce-park",
});

const JOURS: Record<number, string> = {
  3: "Mercredi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

/** Pour qui : le public donné par Mathis le 25 septembre 2026. */
const POUR_QUI = ["Enfants", "Bandes de copains", "Équipes", "Familles"] as const;

/** « 12:00 » → « 12h », « 12:30 » → « 12h30 ». */
function heure(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/*
  Ce que montre le visuel, et rien de plus. Chaque ligne se vérifie sur
  l'image : les filets à gauche, les deux rouleaux au premier plan, le grand
  plateau central, les piliers et les boules à contourner.
*/
const AU_PROGRAMME = [
  {
    titre: "Grimper",
    texte: "Des filets et des murs gonflables à escalader pour passer d'une zone à l'autre.",
  },
  {
    titre: "Ramper",
    texte: "Des tunnels, des rouleaux et des obstacles à franchir par-dessus, par-dessous ou en se faufilant.",
  },
  {
    titre: "Sauter",
    texte: "Un grand plateau central pour rebondir, se lancer des défis et reprendre son souffle.",
  },
] as const;

export default function PageBouncePark() {
  const visuel = resolvePhotos()["bounce-park"];
  const jours = Object.entries(BOUNCE_PARK_HORAIRES).map(([jour, h]) => ({ jour: Number(jour), ...h }));

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 md:pb-20">
      {/* ── En-tête ── */}
      <p className="inline-flex items-center gap-1.5 rounded-full bg-field/15 px-3 py-1 text-xs font-semibold text-field">
        <Calendrier className="size-3.5" />
        Ouverture le {BOUNCE_PARK.ouverture}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold md:text-5xl">
        {BOUNCE_PARK.titre}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Un immense terrain de jeu gonflable s&apos;installe au complexe. Le rebond
        d&apos;un trampoline, le défi d&apos;un parcours d&apos;obstacles : on grimpe, on
        rampe, on saute… et on recommence.
      </p>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ici, on range les écrans et on se dépense pour de vrai — à l&apos;intérieur,
        qu&apos;il pleuve ou qu&apos;il vente.
      </p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Pour qui">
        {POUR_QUI.map((p) => (
          <li
            key={p}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/85"
          >
            {p}
          </li>
        ))}
      </ul>

      {/* ── Le visuel ── */}
      {visuel && (
        <figure className="mt-10">
          {/*
            Le rendu a un fond gris clair uni : posé sur le fond sombre du
            site, il flotterait dans un rectangle blanc. On lui donne donc son
            propre cadre, aux coins arrondis, plutôt que de le détourer.
          */}
          <div className="relative aspect-[10/7] overflow-hidden rounded-3xl border border-border bg-[#e6e6e6]">
            <Photo
              src={visuel}
              alt="Vue 3D du futur Bounce Park : un immense parcours gonflable vert, blanc et noir, avec filets, tunnels, obstacles et un plateau central."
              sizes="(max-width: 1024px) 100vw, 992px"
              preload
              className="object-contain"
            />
          </div>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            Visuel du projet. Le parc installé peut différer dans le détail.
          </figcaption>
        </figure>
      )}

      {/* ── Au programme ── */}
      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold md:text-3xl">
          Au programme
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {AU_PROGRAMME.map((p) => (
            <li key={p.titre} className="rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex rounded-xl bg-field/15 p-2 text-field">
                <Ballon className="size-4" />
              </span>
              <h3 className="mt-3 font-semibold">{p.titre}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Ce qu'on sait / ce qui arrive ── */}
      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold">
            <Horloge className="size-5 text-field" /> Horaires prévus
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            {jours.map((h) => (
              <div key={h.jour} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                <dt className="text-muted-foreground">{JOURS[h.jour]}</dt>
                <dd className="font-medium">
                  {heure(h.debut)} – {heure(h.fin)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            À partir du {BOUNCE_PARK.ouverture}. {ADRESSE.rue}, {ADRESSE.codePostal} {ADRESSE.ville}.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-white/20 bg-card/60 p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
            Annoncé avant l&apos;ouverture
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Les tarifs</li>
            <li>L&apos;âge minimum</li>
            <li>La réservation en ligne, sur ce site</li>
          </ul>
          <p className="mt-4 text-sm">
            Une question d&apos;ici là ?{" "}
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-h-6 items-center gap-1 break-all py-0.5 text-field underline-offset-4 hover:underline"
            >
              <Enveloppe className="size-3.5 shrink-0" />
              {EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* ── En attendant ── */}
      <section className="mt-14 rounded-3xl border border-field/30 bg-field/5 p-6 md:p-8">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold md:text-2xl">
          <Gateau className="size-5 text-field" /> En attendant, le complexe est ouvert
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Anniversaires, Bubble Foot, location de terrain et team building : tout le reste se
          réserve déjà.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={hrefActivite("anniversaire")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-field px-5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Réserver un anniversaire <FlecheDroite className="size-4" />
          </Link>
          <Link
            href="/reservation"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:border-field/50"
          >
            Voir toutes les activités
          </Link>
        </div>
      </section>
    </div>
  );
}
