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
              ? "border-border bg-background/90 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)] backdrop-blur-xl"
              : "border-transparent bg-background/75 backdrop-blur-md"
        )}
      >
        <div className="relative z-[70] mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-5 lg:px-6">
          <Logo href="/" size="md" className="shrink-0" />

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="h-10 px-3.5 text-sm font-medium text-foreground hover:bg-muted"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              variant="outline"
              className="hidden h-10 rounded-full border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-none hover:bg-muted lg:inline-flex"
              asChild
            >
              <Link href="/signup/tutor">Become a tutor</Link>
            </Button>
            <Button
              className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
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
                "inline-flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors",
                open ? "bg-muted" : "hover:bg-muted"
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
              className="absolute inset-0 bg-background"
              initial={{ clipPath: "circle(0% at calc(100% - 2.25rem) 2rem)" }}
              animate={{ clipPath: "circle(150% at calc(100% - 2.25rem) 2rem)" }}
              exit={{ clipPath: "circle(0% at calc(100% - 2.25rem) 2rem)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(var(--primary)/0.16),transparent_42%)]"
              aria-hidden
            />

            <div className="relative z-10 flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
              <nav className="flex flex-1 flex-col justify-center gap-2">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-3 py-3 text-2xl font-medium tracking-tight text-foreground transition-colors hover:bg-muted"
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
                className="grid gap-3 border-t border-border pt-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Button
                  className="h-12 rounded-full bg-foreground text-sm font-medium text-background hover:bg-foreground/90"
                  asChild
                >
                  <Link href="/signup/student" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-border bg-card text-sm font-medium text-foreground hover:bg-muted"
                  asChild
                >
                  <Link href="/signup/tutor" onClick={() => setOpen(false)}>
                    Become a tutor
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 rounded-full text-sm font-medium text-foreground hover:bg-muted"
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
