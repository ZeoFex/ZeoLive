import type { LandingCms } from "@/lib/cms-types";
import { CMS_LANDING_KEY } from "@/lib/cms-types";
import { defaultLandingCms } from "@/lib/cms-defaults";
import { prisma } from "@/lib/prisma";

function mergeLanding(partial: Partial<LandingCms> | null): LandingCms {
  const defaults = defaultLandingCms();
  if (!partial) return defaults;
  return {
    hero: { ...defaults.hero, ...partial.hero },
    stats: { ...defaults.stats, ...partial.stats },
    showcase: { ...defaults.showcase, ...partial.showcase },
    features: {
      heading: { ...defaults.features.heading, ...partial.features?.heading },
      items: partial.features?.items?.length
        ? partial.features.items
        : defaults.features.items,
    },
    howItWorks: {
      heading: { ...defaults.howItWorks.heading, ...partial.howItWorks?.heading },
      steps: partial.howItWorks?.steps?.length
        ? partial.howItWorks.steps
        : defaults.howItWorks.steps,
    },
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
