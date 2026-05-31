import {
  Calendar,
  CreditCard,
  PenLine,
  Shield,
  UserCheck,
  Video,
} from "lucide-react";
import { LandingImage } from "@/components/shared/landing-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { siteImages } from "@/lib/site-images";

const features = [
  {
    icon: Video,
    title: "Live video sessions",
    description: "Meet in the browser with video, audio, and a shared whiteboard.",
  },
  {
    icon: UserCheck,
    title: "Tutor verification",
    description: "We review credentials before a tutor profile goes live.",
  },
  {
    icon: Calendar,
    title: "Scheduling",
    description: "Students book from a tutor’s published availability.",
  },
  {
    icon: PenLine,
    title: "Session notes",
    description: "Optional recordings and materials stay tied to each lesson.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Students pay per session or on a monthly plan. Tutors see payouts in one place.",
  },
  {
    icon: Shield,
    title: "Account security",
    description: "Standard encryption for sign-in, payments, and classroom access.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              title="What the platform includes"
              description="Built for recurring lessons between the same student and tutor, not one-off video calls."
            />
            <LandingImage
              src={siteImages.classroom.src}
              alt={siteImages.classroom.alt}
              className="mt-8 aspect-[16/10] rounded-lg border lg:mt-10"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-none">
                <CardHeader className="pb-2">
                  <feature.icon
                    className="h-5 w-5 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <CardTitle className="text-base font-medium">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
