import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import {
  getPlatformSettings,
  getSystemOverview,
  savePlatformSettings,
} from "@/lib/platform-settings";
import type { PlatformSettingsPatch } from "@/lib/platform-settings-types";

const patchSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().max(500).optional(),
    allowStudentSignup: z.boolean().optional(),
    allowTutorSignup: z.boolean().optional(),
    classroomChatEnabled: z.boolean().optional(),
    autoSeedTutorRatings: z.boolean().optional(),
    supportEmail: z.union([z.string().email(), z.literal("")]).optional(),
    contactPhone: z.string().max(40).optional(),
    sessionJoinEarlyMinutes: z.number().int().min(0).max(120).optional(),
    sessionJoinLateMinutes: z.number().int().min(0).max(120).optional(),
    maxUploadSizeMb: z.number().int().min(1).max(50).optional(),
    notifyAdminsOnNewTutorApplication: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const [settings, overview] = await Promise.all([
      getPlatformSettings(),
      getSystemOverview(),
    ]);
    return NextResponse.json({ settings, overview });
  } catch (error) {
    console.error("Admin settings GET:", error);
    return NextResponse.json(
      { error: "Could not load platform settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const body = patchSchema.parse(await request.json()) as PlatformSettingsPatch;
    const settings = await savePlatformSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }
    console.error("Admin settings PATCH:", error);
    const message =
      error instanceof Error ? error.message : "Could not save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
