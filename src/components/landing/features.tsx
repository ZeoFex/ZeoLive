import { LandingImage } from "@/components/shared/landing-image";
import { LandingVideo } from "@/components/landing/landing-video";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { featureIcon } from "@/components/landing/feature-icons";
import type { LandingCms } from "@/lib/cms-types";

export function Features({ content }: { content: LandingCms["features"] }) {
  const hasVideo = Boolean(content.videoUrl?.trim());

  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
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
                className="mt-8 aspect-[16/10] rounded-lg border lg:mt-10"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {content.items.map((feature) => {
              const Icon = featureIcon(feature.icon);
              return (
                <Card key={feature.title} className="shadow-none">
                  <CardHeader className="pb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                    <CardTitle className="text-base font-medium">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
