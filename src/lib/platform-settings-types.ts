import { BRAND_EMAIL } from "@/lib/brand";

export const PLATFORM_SETTINGS_KEY = "platform_settings";

/** Typed platform configuration stored in CmsEntry (JSON). */
export type PlatformSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowStudentSignup: boolean;
  allowTutorSignup: boolean;
  classroomChatEnabled: boolean;
  autoSeedTutorRatings: boolean;
  supportEmail: string;
  contactPhone: string;
  sessionJoinEarlyMinutes: number;
  sessionJoinLateMinutes: number;
  maxUploadSizeMb: number;
  notifyAdminsOnNewTutorApplication: boolean;
};

export type PlatformSettingsPatch = Partial<PlatformSettings>;

export function defaultPlatformSettings(): PlatformSettings {
  return {
    maintenanceMode: false,
    maintenanceMessage:
      "Zeolive is temporarily unavailable for scheduled maintenance. Please check back soon.",
    allowStudentSignup: true,
    allowTutorSignup: true,
    classroomChatEnabled: true,
    autoSeedTutorRatings: true,
    supportEmail: BRAND_EMAIL,
    contactPhone: "",
    sessionJoinEarlyMinutes: 15,
    sessionJoinLateMinutes: 30,
    maxUploadSizeMb: 10,
    notifyAdminsOnNewTutorApplication: true,
  };
}

export type SystemOverview = {
  students: number;
  tutors: number;
  admins: number;
  subadmins: number;
  sessions: number;
  conversations: number;
  messages: number;
  pendingTutors: number;
};

export const WIPE_CONFIRM_PHRASE = "DELETE ALL PLATFORM DATA";
