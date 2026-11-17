"use client";

import { GlobeStage } from "@/components/landing/globe-stage";
import { MotionTitle } from "@/components/landing/motion-card";
import type { CmsShowcasePanel } from "@/lib/cms-types";

export function ShowcaseGrid({ panels }: { panels: CmsShowcasePanel[] }) {
  return (
    <div className="mt-8 grid items-center gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.75fr)] lg:gap-12">
      <GlobeStage />
      {panels.length > 0 ? (
        <ol className="divide-y divide-border rounded-2xl border border-border bg-card px-4 sm:px-5">
          {panels.map((panel, index) => (
            <li key={`${panel.title}-${panel.imageSrc}`} className="py-4 sm:py-5">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <MotionTitle
                as="p"
                text={panel.title}
                className="mt-2 text-xl font-medium tracking-tight text-foreground"
              />
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {panel.description}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
