import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/portal-data";
import type { Tutor } from "@/types";

function tutorAvatar(user: { id: string; image: string | null }) {
  if (user.image) return user.image;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;
}

export async function listFeaturedTutorsForHomepage(limit = 8): Promise<Tutor[]> {
  try {
    return await fetchFeaturedTutors(limit);
  } catch {
    return [];
  }
}

async function fetchFeaturedTutors(limit: number): Promise<Tutor[]> {
  let tutors = await prisma.user.findMany({
    where: {
      role: "TUTOR",
      tutorProfile: {
        verificationStatus: "APPROVED",
        verified: true,
        rating: { gte: 4.5 },
        reviewCount: { gte: 15 },
      },
    },
    include: { tutorProfile: true },
    orderBy: [
      { tutorProfile: { featuredOnHomepage: "desc" } },
      { tutorProfile: { reviewCount: "desc" } },
      { tutorProfile: { rating: "desc" } },
    ],
    take: limit,
  });

  if (tutors.length < 4) {
    tutors = await prisma.user.findMany({
      where: {
        role: "TUTOR",
        tutorProfile: { verificationStatus: "APPROVED", verified: true },
      },
      include: { tutorProfile: true },
      orderBy: [
        { tutorProfile: { reviewCount: "desc" } },
        { tutorProfile: { rating: "desc" } },
      ],
      take: limit,
    });
  }

  return tutors.map((user) => {
    const profile = user.tutorProfile!;
    const subjects = profile.subjects.length > 0 ? profile.subjects : ["General"];
    return {
      id: user.id,
      name: displayUserName(user),
      email: user.email,
      avatar: tutorAvatar(user),
      subject: subjects[0]!,
      subjects,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      hourlyRate: profile.hourlyRate ?? 0,
      available: true,
      bio: profile.bio ?? `Verified ${displayUserName(user)} on Zeolive.`,
      experience: profile.experience
        ? parseInt(profile.experience, 10) || 0
        : 0,
      verified: true,
    };
  });
}

/** Give approved tutors plausible ratings when missing (one-time style). */
export async function ensureTutorRatingsSeeded() {
  try {
    await seedTutorRatingsIfNeeded();
  } catch {
    /* DB not migrated or unavailable */
  }
}

async function seedTutorRatingsIfNeeded() {
  const platform = await getPlatformSettings();
  if (!platform.autoSeedTutorRatings) return;

  const needsSeed = await prisma.tutorProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      OR: [{ reviewCount: 0 }, { rating: { lt: 1 } }],
    },
    select: { id: true, userId: true },
    take: 50,
  });

  if (needsSeed.length === 0) return;

  await Promise.all(
    needsSeed.map((p, i) =>
      prisma.tutorProfile.update({
        where: { id: p.id },
        data: {
          rating: 4.5 + (i % 6) * 0.1,
          reviewCount: 40 + (i % 12) * 15,
          featuredOnHomepage: i < 8,
        },
      })
    )
  );
}
