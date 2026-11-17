"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import type { CmsStats } from "@/lib/cms-types";

export function Stats({ stats }: { stats: CmsStats }) {
  const items = [
    { label: "Tutors on the platform", value: stats.tutors, suffix: "" },
    { label: "Registered students", value: stats.students, suffix: "" },
    { label: "Sessions on the platform", value: stats.liveSessions, suffix: "" },
    { label: "Sessions completed on time", value: stats.successRate, suffix: "%" },
  ];

  return (
    <section className="px-4 pb-2 pt-4 sm:px-4 sm:pt-5 lg:px-5">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-4">
        {items.map((stat, index) => (
          <div
            key={stat.label}
            className={`border-border px-4 py-4 sm:px-6 sm:py-6 ${
              index % 2 === 1 ? "max-sm:border-l" : ""
            } ${index >= 2 ? "max-sm:border-t" : ""} ${index > 0 ? "sm:border-l" : ""}`}
          >
            <CountUp value={stat.value} suffix={stat.suffix} />
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, (current) => `${Math.round(current).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const from = value > 8 ? Math.round(value * 0.7) : 0;
    motionValue.set(from);
    const controls = animate(motionValue, value, {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, motionValue, reduce, value]);

  return (
    <motion.p ref={ref} className="text-2xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
      {text}
    </motion.p>
  );
}
