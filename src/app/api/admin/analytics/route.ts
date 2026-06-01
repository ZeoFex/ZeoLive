import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminAnalytics } from "@/lib/analytics";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const analytics = await getAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Could not load analytics" },
      { status: 500 }
    );
  }
}
