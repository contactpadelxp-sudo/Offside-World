import Link from "next/link";
import { Ballon } from "@/components/icons";

/** Page inexistante. On renvoie vers ce que le visiteur cherchait sans doute. */
export default function Introuvable() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center md:py-32">
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
