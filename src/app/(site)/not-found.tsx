import Link from "next/link";
import { Ballon } from "@/components/icons";

/** Page inexistante. On renvoie vers ce que le visiteur cherchait sans doute. */
/*
  RÉTABLI, ET CE N'EST PAS UN DOUBLON DU 404 RACINE.

  Il avait été supprimé en déplaçant le 404 à la racine — seul endroit qui
  attrape les adresses ne correspondant à aucune route. Mais les deux ne
  couvrent pas la même chose, et celui-ci apporte ce que l'autre ne peut pas :
  la coquille du site.

  Un `notFound()` levé DANS le site — un article de blog effacé, par exemple —
  passe par `(site)/layout.tsx`, qui monte la préférence « mouvement réduit »,
  le bandeau cookies et la mesure d'audience. Sans ce fichier, ces trois-là
  disparaissaient sur la page 404 : les animations cessaient d'honorer le
  réglage système, un visiteur arrivé par un lien mort ne pouvait plus régler
  son consentement avant de naviguer, et la vue n'était plus comptée.

  Le 404 de la racine reste nécessaire pour les adresses inconnues, qui
  n'appartiennent à aucun groupe et ne peuvent donc pas avoir de coquille.
*/
export default function Introuvable() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-32 pb-12 md:pt-36 md:pb-20 text-center md:py-32">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-field/15 text-field">
        <Ballon className="size-7" />
      </span>
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold md:text-3xl">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-3 text-muted-foreground">
        Le lien est peut-être ancien, ou mal recopié.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/reservation"
          className="btn-glass-field inline-flex h-12 items-center justify-center rounded-2xl px-6 font-semibold text-[#0a0a0b]"
        >
          Réserver
        </Link>
        <Link
          href="/"
          className="btn-outline-light inline-flex h-12 items-center justify-center rounded-2xl px-6"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
