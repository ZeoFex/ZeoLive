import { ShowcaseGrid } from "@/components/landing/showcase-grid";
import { SectionHeading } from "@/components/landing/section-heading";
import type { CmsShowcase } from "@/lib/cms-types";

export function Showcase({ heading }: { heading: CmsShowcase }) {
  return (
    <section className="px-4 py-14 sm:px-4 sm:py-16 lg:px-5 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          The classroom
        </p>
        <SectionHeading
          title={heading.title}
          description={heading.description}
          className="mt-3 max-w-3xl"
        />
        <ShowcaseGrid panels={heading.panels} />
      </div>
    </section>
  );
}
