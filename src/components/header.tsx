"use client";

import Link from "next/link";
import { RESERVER_RESET_EVENT } from "@/lib/events";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Menu } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { hrefActivite } from "@/data/activites";

const navLinksLeft = [
  { label: "Accueil", href: "/" },
  { label: "Anniversaires", href: hrefActivite("anniversaire") },
  { label: "Blog", href: "/blog" },
];

const navLinksRight = [
  { label: "Terrain", href: hrefActivite("foot") },
  { label: "Bubble & Team", href: hrefActivite("groupes") },
  { label: "Réserver", href: "/reservation", cta: true },
];

const navLinks = [...navLinksLeft, ...navLinksRight.filter(l => !l.cta)];

export function Header({ logoSrc }: { logoSrc: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /**
   * Sur /reservation, Next considère le lien « Réserver » comme la page
   * courante et ne navigue pas : on annule le lien et on demande au tunnel de
   * revenir au choix des trois activités. Ailleurs, le lien fonctionne normalement.
   */
  const handleReserver = (e: React.MouseEvent) => {
    if (pathname !== "/reservation") return;
    e.preventDefault();
    window.dispatchEvent(new Event(RESERVER_RESET_EVENT));
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {scrolled ? (
          /* ── Compact pill navbar ── */
          <motion.header
            key="compact"
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center pt-3 px-4 pointer-events-none"
          >
            <nav className="pointer-events-auto relative w-full max-w-3xl flex items-center justify-center gap-1 h-12 rounded-full bg-[#121214]/90 backdrop-blur-2xl shadow-[0_2px_24px_rgba(0,0,0,0.5)] border border-white/10 px-4">
              {/* Left nav */}
              <div className="hidden md:flex items-center gap-0.5 flex-1 justify-end">
                {navLinksLeft.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground rounded-full hover:bg-white/10 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Logo central */}
              <Link href="/" aria-label="Offside Foot Indoor — accueil" className="shrink-0 mx-3 flex items-center">
                <Logo src={logoSrc} height={28} className="h-6 sm:h-7" textClassName="text-base" />
              </Link>

              {/* Right nav */}
              <div className="hidden md:flex items-center gap-0.5 flex-1 justify-start">
                {navLinksRight.map((link) =>
                  link.cta ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleReserver}
                      className="inline-flex items-center gap-1.5 text-[#0a0a0b] font-semibold bg-gradient-to-r from-field to-field-dark px-4 h-8 rounded-full text-[12px] ml-1 hover:shadow-md hover:shadow-field/20 transition-shadow duration-300"
                    >
                      Réserver
                    </Link>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground rounded-full hover:bg-white/10 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>

              {/* Mobile burger */}
              <div className="md:hidden absolute right-3">
                <MobileMenu open={open} setOpen={setOpen} />
              </div>
            </nav>
          </motion.header>
        ) : (
          /* ── Full expanded navbar ── */
          <motion.header
            key="expanded"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="pointer-events-none pt-4 px-4 lg:px-6"
          >
            {/*
              PLUS HAUTE ET PLUS AFFIRMÉE TOUT EN HAUT DE LA PAGE.

              C'est le premier écran : la barre y a la place de se déployer, et
              les rubriques méritent d'être lisibles d'un coup d'œil plutôt que
              de s'excuser en 13 px à 70 % d'opacité. Dès que le visiteur
              défile, la barre compacte reprend la main et s'efface — les deux
              états ont des rôles opposés, ils n'ont pas à se ressembler.

              La hauteur passe de 4,5 à 5,5 rem partout ; l'agrandissement des
              TEXTES, lui, n'arrive qu'à 1024 px. Mesuré : en portant les
              rubriques à 15 px dès 768 px, la rangée devenait plus large que sa
              barre et « Accueil » comme « Réserver » se retrouvaient coupés aux
              deux bouts. Le rembourrage haut du hero suit dans `accueil.tsx`,
              sans quoi le titre passerait sous la barre.
            */}
            <div className="pointer-events-auto mx-auto max-w-5xl flex items-center justify-center h-[5.5rem] rounded-2xl bg-[#121214]/70 backdrop-blur-xl border border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.4)] px-6 lg:px-8 gap-2">
              {/* Left nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-end">
                {navLinksLeft.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative whitespace-nowrap px-2.5 py-2 text-[13px] font-semibold text-foreground/90 hover:text-foreground rounded-xl hover:bg-white/10 transition-all duration-200 group lg:px-3.5 lg:text-[15px]"
                  >
                    {link.label}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-field scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </Link>
                ))}
              </nav>

              {/* Logo central */}
              <Link href="/" aria-label="Offside Foot Indoor — accueil" className="shrink-0 mx-4 lg:mx-6 flex items-center">
                <Logo src={logoSrc} height={56} className="h-10 md:h-9 lg:h-14" textClassName="text-lg lg:text-2xl" />
              </Link>

              {/* Right nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-start">
                {navLinksRight.map((link) =>
                  link.cta ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleReserver}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#0a0a0b] font-bold bg-gradient-to-r from-field to-field-dark px-4 h-10 rounded-xl text-[13px] ml-2 lg:px-6 lg:h-11 lg:text-[15px] hover:shadow-lg hover:shadow-field/20 transition-shadow duration-300"
                    >
                      Réserver
                    </Link>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative whitespace-nowrap px-2.5 py-2 text-[13px] font-semibold text-foreground/90 hover:text-foreground rounded-xl hover:bg-white/10 transition-all duration-200 group lg:px-3.5 lg:text-[15px]"
                    >
                      {link.label}
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-field scale-0 group-hover:scale-100 transition-transform duration-200" />
                    </Link>
                  )
                )}
              </nav>

              {/* Mobile */}
              <div className="md:hidden absolute right-6">
                <MobileMenu open={open} setOpen={setOpen} />
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9")}
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      {/*
        Le panneau de shadcn ne porte aucune marge intérieure : sans px-6 ici,
        les liens démarrent à un pixel de la bordure et le bouton « Réserver »
        court jusqu'au bord de l'écran. On la pose donc sur le contenu.
      */}
      <SheetContent side="right" className="w-72">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <nav className="mt-8 flex flex-col gap-3 px-6 pb-6">
          {navLinks.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-foreground block py-1"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <Link
            href="/reservation"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center gap-2 text-[#0a0a0b] w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-field to-kick"
          >
            Réserver
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
