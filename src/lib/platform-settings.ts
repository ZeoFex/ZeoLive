import type {
  PlatformSettings,
  PlatformSettingsPatch,
  SystemOverview,
} from "@/lib/platform-settings-types";
import {
  defaultPlatformSettings,
  PLATFORM_SETTINGS_KEY,
} from "@/lib/platform-settings-types";
import { prisma } from "@/lib/prisma";

export { defaultPlatformSettings };

function mergeSettings(partial: Partial<PlatformSettings> | null): PlatformSettings {
  const defaults = defaultPlatformSettings();
  if (!partial) return defaults;
  return {
    ...defaults,
    ...partial,
    supportEmail: partial.supportEmail?.trim()
      ? partial.supportEmail.trim()
      : defaults.supportEmail,
    sessionJoinEarlyMinutes: clampMinutes(
      partial.sessionJoinEarlyMinutes ?? defaults.sessionJoinEarlyMinutes
    ),
    sessionJoinLateMinutes: clampMinutes(
      partial.sessionJoinLateMinutes ?? defaults.sessionJoinLateMinutes
    ),
    maxUploadSizeMb: clampUploadMb(
      partial.maxUploadSizeMb ?? defaults.maxUploadSizeMb
    ),
  };
}

function clampMinutes(value: number) {
  return Math.min(120, Math.max(0, Math.round(value)));
}

function clampUploadMb(value: number) {
  return Math.min(50, Math.max(1, Math.round(value)));
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!prisma.cmsEntry) {
    return defaultPlatformSettings();
  }

  try {
    const row = await prisma.cmsEntry.findUnique({
      where: { key: PLATFORM_SETTINGS_KEY },
    });
    if (!row?.value || typeof row.value !== "object") {
      return defaultPlatformSettings();
    }
    return mergeSettings(row.value as Partial<PlatformSettings>);
  } catch {
    return defaultPlatformSettings();
  }
}

export async function savePlatformSettings(
  patch: PlatformSettingsPatch
): Promise<PlatformSettings> {
  if (!prisma.cmsEntry) {
    throw new Error(
      "Settings storage is not available. Run: npx prisma generate && npx prisma db push"
    );
  }

  const current = await getPlatformSettings();
  const next = mergeSettings({ ...current, ...patch });

  await prisma.cmsEntry.upsert({
    where: { key: PLATFORM_SETTINGS_KEY },
    create: { key: PLATFORM_SETTINGS_KEY, value: next as object },
    update: { value: next as object },
  });

  return next;
}

export async function getSystemOverview(): Promise<SystemOverview> {
  const [
    students,
    tutors,
    admins,
    subadmins,
    sessions,
    conversations,
    messages,
    pendingTutors,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "ADMIN", adminTier: "SUBADMIN" } }),
    prisma.tutoringSession.count(),
    prisma.tutorStudentConversation.count(),
    prisma.storedMessage.count(),
    prisma.tutorProfile.count({
      where: {
        verificationStatus: {
          in: ["AWAITING_REVIEW", "AWAITING_RECOMMENDATION", "AWAITING_SUPERADMIN"],
        },
      },
    }),
  ]);

  return {
    students,
    tutors,
    admins,
    subadmins,
    sessions,
    conversations,
    messages,
    pendingTutors,
  };
}

/** Public subset for signup pages and maintenance banner. */
export async function getPublicPlatformStatus() {
  const settings = await getPlatformSettings();
  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    allowStudentSignup: settings.allowStudentSignup,
    allowTutorSignup: settings.allowTutorSignup,
    supportEmail: settings.supportEmail,
  };
}
