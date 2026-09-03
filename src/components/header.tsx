"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Menu, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinksLeft = [
  { label: "Accueil", href: "/" },
  { label: "Anniversaires", href: "/reservation?activite=anniversaire" },
  { label: "Entrées libres", href: "/reservation?activite=libre" },
];

const navLinksRight = [
  { label: "Foot", href: "/reservation?activite=foot" },
  { label: "Team Building", href: "/reservation?activite=team-building" },
  { label: "Réserver", href: "/reservation", cta: true },
];

const navLinks = [...navLinksLeft, ...navLinksRight.filter(l => !l.cta)];

export function Header({ logoSrc }: { logoSrc: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
              <Link href="/" aria-label="Offside World — accueil" className="shrink-0 mx-3 flex items-center">
                <Logo src={logoSrc} height={28} className="h-6 sm:h-7" textClassName="text-base" />
              </Link>

              {/* Right nav */}
              <div className="hidden md:flex items-center gap-0.5 flex-1 justify-start">
                {navLinksRight.map((link) =>
                  link.cta ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-[#0a0a0b] font-semibold bg-gradient-to-r from-field to-field-dark px-4 h-8 rounded-full text-[12px] ml-1 hover:shadow-md hover:shadow-field/20 transition-shadow duration-300"
                    >
                      <Zap className="size-3" />
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
            <div className="pointer-events-auto mx-auto max-w-5xl flex items-center justify-center h-[4.5rem] rounded-2xl bg-[#121214]/70 backdrop-blur-xl border border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.4)] px-6 lg:px-8 gap-2">
              {/* Left nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-end">
                {navLinksLeft.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-2 text-[13px] font-medium text-foreground/70 hover:text-foreground rounded-xl hover:bg-white/10 transition-all duration-200 group"
                  >
                    {link.label}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-field scale-0 group-hover:scale-100 transition-transform duration-200" />
                  </Link>
                ))}
              </nav>

              {/* Logo central */}
              <Link href="/" aria-label="Offside World — accueil" className="shrink-0 mx-4 lg:mx-6 flex items-center">
                <Logo src={logoSrc} height={44} className="h-8 md:h-9 lg:h-11" textClassName="text-lg lg:text-xl" />
              </Link>

              {/* Right nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-start">
                {navLinksRight.map((link) =>
                  link.cta ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-[#0a0a0b] font-semibold bg-gradient-to-r from-field to-field-dark px-5 h-9 rounded-xl text-[13px] ml-2 hover:shadow-lg hover:shadow-field/20 transition-shadow duration-300"
                    >
                      Réserver
                    </Link>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative px-3 py-2 text-[13px] font-medium text-foreground/70 hover:text-foreground rounded-xl hover:bg-white/10 transition-all duration-200 group"
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
      <SheetContent side="right" className="w-72">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <nav className="mt-8 flex flex-col gap-3">
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
            <Zap className="size-4" />
            Réserver
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
