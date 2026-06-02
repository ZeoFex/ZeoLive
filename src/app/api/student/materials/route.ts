import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listStudentMaterials } from "@/lib/study-materials";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const materials = await listStudentMaterials(session.user.id);
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Student materials GET:", error);
    return NextResponse.json({ error: "Could not load materials" }, { status: 500 });
  }
}
