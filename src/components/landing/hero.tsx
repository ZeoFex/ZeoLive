import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CmsHero } from "@/lib/cms-types";

export function Hero({ content }: { content: CmsHero }) {
  return (
    <section className="border-b bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-medium text-muted-foreground">{content.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-tight">
            {content.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={content.primaryCtaHref}>{content.primaryCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={content.secondaryCtaHref}>{content.secondaryCta}</Link>
            </Button>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg border bg-muted sm:aspect-[4/3]">
            <Image
              src={content.imageSrc}
              alt={content.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>

          <div className="absolute -bottom-4 left-4 right-4 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:left-auto sm:right-6 sm:max-w-xs">
            <p className="text-sm font-medium text-foreground">{content.cardTitle}</p>
            <ul className="mt-3 space-y-2.5">
              {content.cardItems.map((session) => (
                <li key={`${session.subject}-${session.time}`} className="text-sm">
                  <p className="font-medium text-foreground">{session.subject}</p>
                  <p className="text-muted-foreground">
                    {session.time} · {session.tutor}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{content.cardFootnote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
