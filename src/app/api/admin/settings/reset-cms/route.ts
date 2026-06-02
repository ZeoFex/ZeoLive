import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { defaultLandingCms } from "@/lib/cms-defaults";
import { saveLandingCms } from "@/lib/cms";

export async function POST() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    await saveLandingCms(defaultLandingCms());
    return NextResponse.json({ ok: true, message: "Landing page CMS reset to defaults." });
  } catch (error) {
    console.error("Admin reset CMS:", error);
    return NextResponse.json(
      { error: "Could not reset landing CMS" },
      { status: 500 }
    );
  }
}
