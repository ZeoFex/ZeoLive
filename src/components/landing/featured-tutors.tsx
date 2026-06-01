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
    <section id="tutors" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={heading.title} description={heading.description} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} variant="photo" />
          ))}
        </div>
      </div>
    </section>
  );
}
