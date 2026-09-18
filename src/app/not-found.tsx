import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { resolveLogoSrc } from "@/lib/logo";
import { Ballon } from "@/components/icons";

/**
 * Page 404 — ELLE DOIT RESTER À LA RACINE DE `app/`.
 *
 * Elle vivait dans `(site)/not-found.tsx`. Un `not-found` rangé dans un groupe
 * de routes ne répond qu'aux `notFound()` levés à l'intérieur de ce groupe :
 * une URL qui ne correspond à AUCUNE route n'atteint jamais ce segment, et
 * tombait donc sur l'écran anglais par défaut de Next — « This page could not
 * be found », sans en-tête ni pied de page, au milieu d'un site en français.
 * Seul `app/not-found.tsx` attrape les URL inconnues de toute l'application.
 *
 * Contrepartie du déménagement : la racine ne pose que <html> et <body>, la
 * coquille du site (`(site)/layout.tsx`) ne s'applique plus ici. L'en-tête et
 * le pied de page sont donc montés à la main, sinon le visiteur perdu n'aurait
 * plus aucun moyen de naviguer.
 */
export default function Introuvable() {
  const logoSrc = resolveLogoSrc();

  return (
    <>
      <Header logoSrc={logoSrc} />
      <main className="flex-1">
        {/*
          `pt-32` (128 px) et non `py-24` (96 px) : la barre fixe de l'en-tête
          descend jusqu'à 104 px, le titre passait dessous et se retrouvait
          coupé sur téléphone. Même remembourrage que les pages légales.
        */}
        <div className="mx-auto max-w-lg px-4 pt-32 pb-12 text-center md:pt-36 md:pb-20">
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
      </main>
      <Footer logoSrc={logoSrc} />
    </>
  );
}
