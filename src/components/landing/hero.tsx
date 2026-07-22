"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CmsHero } from "@/lib/cms-types";
import { cn } from "@/lib/utils";

function isLocalSrc(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

export function Hero({ content }: { content: CmsHero }) {
  const slides = content.slides.length
    ? content.slides
    : [
        {
          eyebrow: "",
          title: "Live lessons with tutors you can trust",
          description: "",
          imageSrc: "/images/hero.jpg",
          imageAlt: "Hero",
        },
      ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (paused || content.autoplayMs <= 0 || slides.length < 2) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % slides.length);
    }, content.autoplayMs);
    return () => window.clearInterval(id);
  }, [paused, content.autoplayMs, slides.length, index]);

  const slide = slides[index]!;

  return (
    <section
      className="relative isolate min-h-[min(88vh,760px)] overflow-hidden border-b"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={`bg-${index}-${slide.imageSrc}`}
          className="absolute inset-0"
          custom={direction}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={slide.imageSrc}
            alt={slide.imageAlt}
            fill
            priority={index === 0}
            sizes="100vw"
            unoptimized={!isLocalSrc(slide.imageSrc)}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Blue–white brand wash so copy stays readable */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#003d7a]/92 via-[#0066CC]/72 to-[#00aeef]/28"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#001a33]/55 via-transparent to-white/10"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(88vh,760px)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.7fr)] lg:gap-12">
          <div className="max-w-2xl text-white">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`copy-${index}`}
                custom={direction}
                initial={{ opacity: 0, y: direction > 0 ? 28 : -28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction > 0 ? -20 : 20 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {slide.eyebrow ? (
                  <p className="text-sm font-medium tracking-wide text-sky-100/90">
                    {slide.eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.08]">
                  {slide.title}
                </h1>
                {slide.description ? (
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-sky-50/90 sm:text-lg">
                    {slide.description}
                  </p>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-lg border-0 bg-white px-5 font-semibold text-[#0066CC] shadow-md hover:bg-sky-50"
              >
                <Link href={content.primaryCtaHref}>{content.primaryCta}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-white/40 bg-white/10 px-5 font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href={content.secondaryCtaHref}>{content.secondaryCta}</Link>
              </Button>
            </div>

            {slides.length > 1 ? (
              <div className="mt-10 flex items-center gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
                  {slides.map((_, i) => (
                    <button
                      key={`dot-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => goTo(i, i > index ? 1 : -1)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === index
                          ? "w-8 bg-white"
                          : "w-2 bg-white/45 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {content.cardItems.length > 0 ? (
            <aside className="w-full max-w-sm justify-self-start rounded-2xl border border-white/25 bg-white/95 p-5 text-slate-900 shadow-[0_20px_50px_-24px_rgba(0,54,120,0.55)] backdrop-blur-md lg:justify-self-end">
              <p className="text-sm font-semibold text-slate-900">{content.cardTitle}</p>
              <ul className="mt-3 space-y-3">
                {content.cardItems.map((session) => (
                  <li
                    key={`${session.subject}-${session.time}`}
                    className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-[#0066CC]">{session.subject}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {session.time} · {session.tutor}
                    </p>
                  </li>
                ))}
              </ul>
              {content.cardFootnote ? (
                <p className="mt-3 text-xs text-slate-500">{content.cardFootnote}</p>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
