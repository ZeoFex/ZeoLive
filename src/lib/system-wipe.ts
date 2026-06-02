import { defaultLandingCms } from "@/lib/cms-defaults";
import { saveLandingCms } from "@/lib/cms";
import {
  defaultPlatformSettings,
  savePlatformSettings,
} from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export type WipeResult = {
  deletedUsers: number;
  preservedSuperadminId: string;
};

/**
 * Removes all platform operational data. Keeps only the acting superadmin account.
 */
export async function wipeAllPlatformData(
  preservedSuperadminId: string
): Promise<WipeResult> {
  const userCountBefore = await prisma.user.count();

  await prisma.$transaction([
    prisma.storedMessage.deleteMany(),
    prisma.tutorStudentConversation.deleteMany(),
    prisma.tutoringSession.deleteMany(),
    prisma.tutorRecommendation.deleteMany(),
    prisma.tutorSubadminReview.deleteMany(),
    prisma.tutorProfile.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.cmsEntry.deleteMany(),
    prisma.user.deleteMany({
      where: { id: { not: preservedSuperadminId } },
    }),
  ]);

  await saveLandingCms(defaultLandingCms());
  await savePlatformSettings(defaultPlatformSettings());

  return {
    deletedUsers: userCountBefore - 1,
    preservedSuperadminId,
  };
}
