import { MotionCard, RevealGroup } from "@/components/landing/motion-card";
import { TutorCard } from "@/components/shared/tutor-card";
import { SectionHeading } from "@/components/landing/section-heading";
import type { CmsSectionHeading } from "@/lib/cms-types";
import type { Tutor } from "@/types";

export function FeaturedTutors({
  heading,
  tutors,
}: {
  heading: CmsSectionHeading;
  tutors: Tutor[];
}) {
  if (tutors.length === 0) return null;

  return (
    <section id="tutors" className="bg-muted/40 px-4 py-14 sm:px-4 sm:py-16 lg:px-5 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading title={heading.title} description={heading.description} />
        <RevealGroup connect="none" className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {tutors.map((tutor, index) => (
            <MotionCard key={tutor.id} index={index} className="h-full">
              <TutorCard tutor={tutor} variant="photo" className="h-full rounded-2xl border border-border bg-card" />
            </MotionCard>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
