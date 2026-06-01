import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getLandingCms, saveLandingCms } from "@/lib/cms";
import type { LandingCms } from "@/lib/cms-types";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const cms = await getLandingCms();
    return NextResponse.json({ cms });
  } catch (error) {
    console.error("Admin CMS GET:", error);
    return NextResponse.json(
      { error: "Could not load CMS content" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const body = (await request.json()) as { cms?: LandingCms };
    if (!body.cms) {
      return NextResponse.json({ error: "cms payload required" }, { status: 400 });
    }
    await saveLandingCms(body.cms);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin CMS PUT:", error);
    const message =
      error instanceof Error ? error.message : "Could not save CMS content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
