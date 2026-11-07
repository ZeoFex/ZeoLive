import { NextResponse } from "next/server";
import { listActiveProgrammesWithSubjects } from "@/lib/programmes";

/** Public catalogue for tutor signup / onboarding. */
export async function GET() {
  try {
    const programmes = await listActiveProgrammesWithSubjects();
    return NextResponse.json({
      programmes: programmes.map((programme) => ({
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        subjects: programme.subjects,
      })),
    });
  } catch (error) {
    console.error("List programmes error:", error);
    return NextResponse.json(
      { error: "Could not load programmes" },
      { status: 500 }
    );
  }
}
