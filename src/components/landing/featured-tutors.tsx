import { featuredTutors } from "@/lib/mock-data";
import { TutorCard } from "@/components/shared/tutor-card";
import { SectionHeading } from "@/components/landing/section-heading";

export function FeaturedTutors() {
  return (
    <section id="tutors" className="py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Tutors accepting bookings"
          description="Profiles show subject, hourly rate, and recent student feedback."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} variant="photo" />
          ))}
        </div>
      </div>
    </section>
  );
}
