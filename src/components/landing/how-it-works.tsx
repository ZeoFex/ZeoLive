import { LandingImage } from "@/components/shared/landing-image";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingCms } from "@/lib/cms-types";

export function HowItWorks({ content }: { content: LandingCms["howItWorks"] }) {
  return (
    <section
      id="how-it-works"
      className="border-y bg-muted/40 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={content.heading.title}
          description={content.heading.description}
        />

        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {content.steps.map((item) => (
            <li key={item.step}>
              <LandingImage
                src={item.imageSrc}
                alt={item.imageAlt}
                className="aspect-[3/2] rounded-lg border"
                sizes="(max-width: 768px) 100vw, 30vw"
              />
              <span className="mt-4 block text-sm font-medium text-muted-foreground">
                Step {item.step}
              </span>
              <h3 className="mt-1 text-lg font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
