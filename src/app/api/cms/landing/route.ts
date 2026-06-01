import { NextResponse } from "next/server";
import { getLandingCms, getPublicPlatformStats } from "@/lib/cms";
import { ensureTutorRatingsSeeded, listFeaturedTutorsForHomepage } from "@/lib/featured-tutors";

export async function GET() {
  try {
    await ensureTutorRatingsSeeded();
    const [cms, stats, tutors] = await Promise.all([
      getLandingCms(),
      getPublicPlatformStats(),
      listFeaturedTutorsForHomepage(8),
    ]);

    return NextResponse.json({
      cms: { ...cms, stats },
      tutors,
    });
  } catch (error) {
    console.error("CMS landing error:", error);
    return NextResponse.json(
      { error: "Could not load landing content" },
      { status: 500 }
    );
  }
}
