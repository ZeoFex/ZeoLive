import { MotionCard, MotionTitle, RevealGroup } from "@/components/landing/motion-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import type { HomepageReview } from "@/lib/homepage-reviews";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials({ reviews }: { reviews: HomepageReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="px-4 py-14 sm:px-4 sm:py-16 lg:px-5 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="What students say"
          description="Ratings left after a class."
        />
        <RevealGroup className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((review, index) => (
            <MotionCard key={review.id} index={index} className="h-full">
            <Card className="h-full rounded-2xl border-border bg-card shadow-none transition-shadow duration-500 group-hover:shadow-[0_20px_40px_-28px_rgba(0,102,204,0.5)]">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm font-medium text-amber-500" aria-label={`${review.rating} of 5`}>
                  {"★".repeat(review.rating)}
                  <span className="text-muted-foreground/35">{"★".repeat(Math.max(0, 5 - review.rating))}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  {review.comment || `Rated ${review.tutorName} ${review.rating} of 5.`}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t pt-4">
                  <Avatar className="h-10 w-10">
                    {review.image ? <AvatarImage src={review.image} alt="" /> : null}
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {initials(review.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <MotionTitle as="p" text={review.studentName} className="text-sm font-medium" />
                    <p className="text-xs text-muted-foreground">Class with {review.tutorName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </MotionCard>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
