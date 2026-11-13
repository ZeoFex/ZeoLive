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
    <section className="border-t bg-muted/40 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="What students say"
          description="Ratings left after a class."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <Card key={review.id} className="shadow-none">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-amber-500" aria-label={`${review.rating} of 5`}>
                  {"★".repeat(review.rating)}
                  <span className="text-slate-300">{"★".repeat(Math.max(0, 5 - review.rating))}</span>
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
                    <p className="text-sm font-medium">{review.studentName}</p>
                    <p className="text-xs text-muted-foreground">Class with {review.tutorName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
