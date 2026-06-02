import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  deleteStudyMaterial,
  listTutorMaterials,
  shareMaterialWithStudents,
} from "@/lib/study-materials";

const shareSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { materialId } = await params;
  const deleted = await deleteStudyMaterial(materialId, session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { materialId } = await params;

  try {
    const { studentIds } = shareSchema.parse(await request.json());
    const result = await shareMaterialWithStudents(
      materialId,
      session.user.id,
      studentIds
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const materials = await listTutorMaterials(session.user.id);
    const material = materials.find((m) => m.id === materialId);

    return NextResponse.json({
      ok: true,
      material,
      message: `Now shared with ${result.shared} more student(s)`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Select at least one student" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not share material" }, { status: 500 });
  }
}
