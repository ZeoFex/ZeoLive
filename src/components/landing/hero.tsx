"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { EduStage } from "@/components/landing/edu-stage";
import { ScheduleCard } from "@/components/landing/schedule-card";
import { Button } from "@/components/ui/button";
import type { CmsHero } from "@/lib/cms-types";

export function Hero({ content }: { content: CmsHero }) {
  const reduce = useReducedMotion();
  const slide = content.slides[0];
  const title = slide?.title || "Live lessons with tutors you can trust";
  const description =
    slide?.description ||
    "Find a tutor, schedule a session, and meet in a shared classroom.";
  const showScene = content.scene !== "off";

  return (
    <section className="px-4 pb-2 pt-6 sm:px-4 sm:pt-8 lg:px-5">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide?.eyebrow ? (
              <p className="text-sm font-medium text-primary">{slide.eyebrow}</p>
            ) : null}
            <h1 className="mt-3 max-w-xl text-4xl font-medium tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={content.primaryCtaHref}>{content.primaryCta}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={content.secondaryCtaHref}>{content.secondaryCta}</Link>
              </Button>
            </div>
          </motion.div>

          {showScene ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <EduStage
                kind="academy"
                label="Floating books, a graduation cap, geometric shapes, and a molecule"
                className="h-[min(42vh,340px)] min-h-[260px] sm:h-[min(52vh,520px)] sm:min-h-[340px]"
              />
            </motion.div>
          ) : null}
        </div>

        <div className="relative z-20 mt-6 flex sm:justify-end">
          <ScheduleCard
            title={content.cardTitle}
            items={content.cardItems}
            footnote={content.cardFootnote}
            className="w-full shadow-[0_22px_50px_-28px_rgba(0,0,0,0.45)] sm:max-w-sm"
          />
        </div>
      </div>
    </section>
  );
}
