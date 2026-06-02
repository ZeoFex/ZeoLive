import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { WIPE_CONFIRM_PHRASE } from "@/lib/platform-settings-types";
import { wipeAllPlatformData } from "@/lib/system-wipe";

const bodySchema = z.object({
  confirmPhrase: z.string(),
});

export async function POST(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const { confirmPhrase } = bodySchema.parse(await request.json());

    if (confirmPhrase.trim() !== WIPE_CONFIRM_PHRASE) {
      return NextResponse.json(
        {
          error: `Confirmation phrase must be exactly: ${WIPE_CONFIRM_PHRASE}`,
        },
        { status: 400 }
      );
    }

    const result = await wipeAllPlatformData(authResult.session.user!.id!);

    return NextResponse.json({
      ok: true,
      message: "All platform data has been wiped. Your superadmin account was preserved.",
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Admin settings wipe:", error);
    return NextResponse.json(
      { error: "System wipe failed. Check server logs." },
      { status: 500 }
    );
  }
}
