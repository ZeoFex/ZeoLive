import { LandingImage } from "@/components/shared/landing-image";
import { SectionHeading } from "@/components/landing/section-heading";
import { siteImages } from "@/lib/site-images";

const steps = [
  {
    step: "1",
    title: "Choose a tutor",
    description: "Filter by subject, rate, and open time slots.",
    image: siteImages.steps.browse,
  },
  {
    step: "2",
    title: "Book a time",
    description: "Confirm the session and pay through ZoeLive.",
    image: siteImages.steps.book,
  },
  {
    step: "3",
    title: "Join the classroom",
    description: "Both sides use the same link at the scheduled time.",
    image: siteImages.steps.join,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y bg-muted/40 py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="How it works" />
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step}>
              <LandingImage
                src={item.image.src}
                alt={item.image.alt}
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
