import type {
  CmsHero,
  CmsHowItWorks,
  CmsShowcase,
  LandingCms,
} from "@/lib/cms-types";
import { CMS_LANDING_KEY } from "@/lib/cms-types";
import { defaultLandingCms } from "@/lib/cms-defaults";
import { prisma } from "@/lib/prisma";

type LegacyHero = Partial<CmsHero> & {
  eyebrow?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
};

function mergeHero(defaults: CmsHero, partial: LegacyHero | undefined): CmsHero {
  if (!partial) return defaults;

  const migratedSlides =
    partial.slides?.length
      ? partial.slides
      : partial.imageSrc || partial.title
        ? [
            {
              eyebrow: partial.eyebrow ?? defaults.slides[0]?.eyebrow ?? "",
              title: partial.title ?? defaults.slides[0]?.title ?? "",
              description:
                partial.description ?? defaults.slides[0]?.description ?? "",
              imageSrc: partial.imageSrc ?? defaults.slides[0]?.imageSrc ?? "",
              imageAlt: partial.imageAlt ?? defaults.slides[0]?.imageAlt ?? "",
            },
          ]
        : defaults.slides;

  return {
    slides: migratedSlides,
    autoplayMs:
      typeof partial.autoplayMs === "number"
        ? partial.autoplayMs
        : defaults.autoplayMs,
    primaryCta: partial.primaryCta ?? defaults.primaryCta,
    primaryCtaHref: partial.primaryCtaHref ?? defaults.primaryCtaHref,
    secondaryCta: partial.secondaryCta ?? defaults.secondaryCta,
    secondaryCtaHref: partial.secondaryCtaHref ?? defaults.secondaryCtaHref,
    cardTitle: partial.cardTitle ?? defaults.cardTitle,
    cardItems: partial.cardItems?.length ? partial.cardItems : defaults.cardItems,
    cardFootnote: partial.cardFootnote ?? defaults.cardFootnote,
  };
}

function mergeShowcase(
  defaults: CmsShowcase,
  partial: Partial<CmsShowcase> & { imageSrc?: string; imageAlt?: string } | undefined
): CmsShowcase {
  if (!partial) return defaults;

  // Migrate older CMS rows that only stored a single showcase image.
  const panels =
    partial.panels?.length
      ? partial.panels
      : partial.imageSrc
        ? defaults.panels.map((panel, index) =>
            index === 0
              ? {
                  ...panel,
                  imageSrc: partial.imageSrc!,
                  imageAlt: partial.imageAlt || panel.imageAlt,
                }
              : panel
          )
        : defaults.panels;

  return {
    title: partial.title ?? defaults.title,
    description: partial.description ?? defaults.description,
    panels,
  };
}

function mergeHowItWorks(
  defaults: CmsHowItWorks,
  partial: (Partial<CmsHowItWorks> & {
    videoUrl?: string;
    videoTitle?: string;
    videoPosterSrc?: string;
  }) | undefined
): CmsHowItWorks {
  if (!partial) return defaults;
  return {
    heading: { ...defaults.heading, ...partial.heading },
    steps: partial.steps?.length ? partial.steps : defaults.steps,
  };
}

function mergeLanding(partial: Partial<LandingCms> | null): LandingCms {
  const defaults = defaultLandingCms();
  if (!partial) return defaults;

  const legacyHowItWorks = partial.howItWorks as
    | (Partial<LandingCms["howItWorks"]> & {
        videoUrl?: string;
        videoTitle?: string;
        videoPosterSrc?: string;
      })
    | undefined;

  const partialFeatures = partial.features as
    | Partial<LandingCms["features"]>
    | undefined;

  return {
    hero: mergeHero(defaults.hero, partial.hero),
    stats: { ...defaults.stats, ...partial.stats },
    showcase: mergeShowcase(defaults.showcase, partial.showcase),
    features: {
      heading: {
        ...defaults.features.heading,
        ...partialFeatures?.heading,
      },
      imageSrc: partialFeatures?.imageSrc ?? defaults.features.imageSrc,
      imageAlt: partialFeatures?.imageAlt ?? defaults.features.imageAlt,
      videoUrl:
        partialFeatures?.videoUrl ||
        legacyHowItWorks?.videoUrl ||
        defaults.features.videoUrl,
      videoTitle:
        partialFeatures?.videoTitle ||
        legacyHowItWorks?.videoTitle ||
        defaults.features.videoTitle,
      videoPosterSrc:
        partialFeatures?.videoPosterSrc ||
        legacyHowItWorks?.videoPosterSrc ||
        defaults.features.videoPosterSrc,
      items: partialFeatures?.items?.length
        ? partialFeatures.items
        : defaults.features.items,
    },
    howItWorks: mergeHowItWorks(defaults.howItWorks, partial.howItWorks),
    featuredTutors: {
      ...defaults.featuredTutors,
      ...partial.featuredTutors,
    },
    testimonials: {
      heading: {
        ...defaults.testimonials.heading,
        ...partial.testimonials?.heading,
      },
      items: partial.testimonials?.items?.length
        ? partial.testimonials.items
        : defaults.testimonials.items,
    },
    pricing: {
      heading: { ...defaults.pricing.heading, ...partial.pricing?.heading },
      plans: partial.pricing?.plans?.length
        ? partial.pricing.plans
        : defaults.pricing.plans,
    },
    faq: {
      heading: { ...defaults.faq.heading, ...partial.faq?.heading },
      items: partial.faq?.items?.length ? partial.faq.items : defaults.faq.items,
    },
  };
}

export async function getLandingCms(): Promise<LandingCms> {
  if (!prisma.cmsEntry) {
    return defaultLandingCms();
  }

  try {
    const row = await prisma.cmsEntry.findUnique({
      where: { key: CMS_LANDING_KEY },
    });
    if (!row?.value || typeof row.value !== "object") {
      return defaultLandingCms();
    }
    return mergeLanding(row.value as Partial<LandingCms>);
  } catch {
    return defaultLandingCms();
  }
}

export async function saveLandingCms(content: LandingCms) {
  if (!prisma.cmsEntry) {
    throw new Error(
      "CMS is not available. Run: npx prisma generate && npx prisma db push"
    );
  }

  await prisma.cmsEntry.upsert({
    where: { key: CMS_LANDING_KEY },
    create: { key: CMS_LANDING_KEY, value: content as object },
    update: { value: content as object },
  });
}

export async function getPublicPlatformStats() {
  const cms = await getLandingCms();
  try {
    const [tutorCount, studentCount, sessionCount] = await Promise.all([
      prisma.tutorProfile.count({
        where: { verificationStatus: "APPROVED", verified: true },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.tutoringSession.count({
        where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      }),
    ]);

    return {
      tutors: tutorCount > 0 ? tutorCount : cms.stats.tutors,
      students: studentCount > 0 ? studentCount : cms.stats.students,
      liveSessions: sessionCount > 0 ? sessionCount : cms.stats.liveSessions,
      successRate: cms.stats.successRate,
    };
  } catch {
    return cms.stats;
  }
}
