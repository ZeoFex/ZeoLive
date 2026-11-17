import { MotionCard, MotionTitle, RevealGroup } from "@/components/landing/motion-card";
import { EduStage, type EduKind } from "@/components/landing/edu-stage";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingCms } from "@/lib/cms-types";

const stepScenes: Array<{ kind: EduKind; label: string }> = [
  { kind: "book", label: "Animated open book" },
  { kind: "geometry", label: "Animated geometric model with a clock ring" },
  { kind: "molecule", label: "Animated molecular model" },
];

export function HowItWorks({ content }: { content: LandingCms["howItWorks"] }) {
  return (
    <section
      id="how-it-works"
      className="px-4 py-14 sm:px-4 sm:py-16 lg:px-5 lg:py-24"
    >
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading
          title={content.heading.title}
          description={content.heading.description}
        />

        <RevealGroup className="mt-8 grid gap-8 md:mt-12 md:grid-cols-3 md:gap-10" connect="none">
          {content.steps.map((item, index) => {
            const scene = stepScenes[index] ?? stepScenes[0]!;
            return (
              <MotionCard key={item.step} index={index} className="h-full">
                <div className="h-full">
                  <EduStage kind={scene.kind} label={item.imageAlt || scene.label} className="aspect-[16/10] w-full" />
                  <span className="mt-4 block text-sm font-medium text-muted-foreground">
                    Step {item.step}
                  </span>
                  <MotionTitle
                    as="h3"
                    text={item.title}
                    className="mt-1 text-lg font-medium text-foreground"
                  />
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </MotionCard>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
