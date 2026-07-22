import { LandingImage } from "@/components/shared/landing-image";
import { SectionHeading } from "@/components/landing/section-heading";
import type { CmsShowcase } from "@/lib/cms-types";

export function Showcase({ heading }: { heading: CmsShowcase }) {
  return (
    <section className="border-b bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={heading.title} description={heading.description} />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {heading.panels.map((panel) => (
            <figure
              key={`${panel.title}-${panel.imageSrc}`}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <LandingImage
                src={panel.imageSrc}
                alt={panel.imageAlt}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <figcaption className="border-t px-4 py-3">
                <p className="text-sm font-medium text-foreground">{panel.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {panel.description}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
