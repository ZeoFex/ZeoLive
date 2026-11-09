"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#tutors", label: "Tutors" },
  { href: "#faq", label: "FAQ" },
];

function AnimatedHamburger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span
        className={cn(
          "absolute left-0 top-0 block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "translate-y-[7px] rotate-45"
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-[7px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-[14px] block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "-translate-y-[7px] -rotate-45"
        )}
      />
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[60] border-b transition-[background-color,box-shadow,border-color] duration-300",
          open
            ? "border-transparent bg-transparent"
            : scrolled
              ? "border-slate-200/80 bg-white/90 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85"
              : "border-transparent bg-white/70 backdrop-blur-md dark:bg-slate-950/60"
        )}
      >
        <div className="relative z-[70] mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <Logo href="/" size="md" inverted={open} className="shrink-0" />

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-[#0066CC] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-sky-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="h-10 px-3.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#0066CC] dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              variant="outline"
              className="hidden h-10 border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-none hover:border-sky-200 hover:bg-sky-50 hover:text-[#0066CC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-800 dark:hover:text-sky-300 lg:inline-flex"
              asChild
            >
              <Link href="/signup/tutor">Become a tutor</Link>
            </Button>
            <Button
              className="h-10 bg-[linear-gradient(135deg,#00aeef_0%,#0066cc_55%,#0054a6_100%)] px-4 text-sm font-medium text-white shadow-[0_10px_20px_-12px_rgba(0,102,204,0.8)] hover:opacity-95"
              asChild
            >
              <Link href="/signup/student">Sign up</Link>
            </Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <div className={cn(open && "opacity-0 pointer-events-none")}>
              <ThemeToggle />
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-800 transition-colors dark:text-slate-100",
                open
                  ? "bg-white/15 text-white hover:bg-white/20"
                  : "hover:bg-sky-50 hover:text-[#0066CC]"
              )}
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav-panel"
            >
              <AnimatedHamburger open={open} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav-panel"
            key="mobile-nav"
            className="fixed inset-0 z-[55] flex flex-col md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(160deg,#003d7a_0%,#0066cc_42%,#00aeef_100%)]"
              initial={{ clipPath: "circle(0% at calc(100% - 2.25rem) 2rem)" }}
              animate={{ clipPath: "circle(150% at calc(100% - 2.25rem) 2rem)" }}
              exit={{ clipPath: "circle(0% at calc(100% - 2.25rem) 2rem)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.28), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.16), transparent 35%)",
              }}
              aria-hidden
            />

            <div className="relative z-10 flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
              <nav className="flex flex-1 flex-col justify-center gap-2">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-3 py-3.5 text-3xl font-semibold tracking-tight text-white/95 transition-colors hover:bg-white/10"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      delay: 0.08 + index * 0.05,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <motion.div
                className="grid gap-3 border-t border-white/15 pt-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Button
                  className="h-12 rounded-xl bg-white text-sm font-medium text-[#0066CC] hover:bg-white/95"
                  asChild
                >
                  <Link href="/signup/student" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-white/35 bg-transparent text-sm font-medium text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/signup/tutor" onClick={() => setOpen(false)}>
                    Become a tutor
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 rounded-xl text-sm font-medium text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
