import { MotionCard, MotionTitle, RevealGroup } from "@/components/landing/motion-card";
import { LandingImage } from "@/components/shared/landing-image";
import { LandingVideo } from "@/components/landing/landing-video";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { featureIcon } from "@/components/landing/feature-icons";
import type { LandingCms } from "@/lib/cms-types";

export function Features({ content }: { content: LandingCms["features"] }) {
  const hasVideo = Boolean(content.videoUrl?.trim());

  return (
    <section id="features" className="bg-muted/40 px-4 py-14 sm:px-4 sm:py-16 lg:px-5 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              title={content.heading.title}
              description={content.heading.description}
            />
            {hasVideo ? (
              <LandingVideo
                className="mt-8 lg:mt-10"
                videoUrl={content.videoUrl}
                title=""
                posterSrc={content.videoPosterSrc || content.imageSrc}
              />
            ) : (
              <LandingImage
                src={content.imageSrc}
                alt={content.imageAlt}
                className="mt-6 aspect-[16/10] rounded-2xl border border-border sm:mt-8 lg:mt-10"
                imageClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            )}
          </div>

          <RevealGroup className="grid gap-3 sm:grid-cols-2 sm:gap-4" connect="none">
            {content.items.map((feature, index) => {
              const Icon = featureIcon(feature.icon);
              return (
                <MotionCard key={feature.title} index={index} className="h-full">
                <Card className="h-full rounded-2xl border-border bg-card text-card-foreground shadow-none transition-shadow duration-500 group-hover:shadow-[0_20px_40px_-28px_rgba(0,102,204,0.45)]">
                  <CardHeader className="pb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                    <MotionTitle as="h3" text={feature.title} className="text-base font-medium" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
                </MotionCard>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
