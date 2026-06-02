import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  createStudyMaterial,
  listTutorMaterials,
} from "@/lib/study-materials";
import { saveStudyMaterialFile } from "@/lib/upload-document";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const materials = await listTutorMaterials(session.user.id);
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Tutor materials GET:", error);
    return NextResponse.json({ error: "Could not load materials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const studentIdsRaw = form.get("studentIds");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let studentIds: string[] = [];
    if (typeof studentIdsRaw === "string" && studentIdsRaw) {
      try {
        const parsed = JSON.parse(studentIdsRaw) as unknown;
        if (Array.isArray(parsed)) {
          studentIds = parsed.filter((id): id is string => typeof id === "string");
        }
      } catch {
        return NextResponse.json({ error: "Invalid student selection" }, { status: 400 });
      }
    }

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one student to share with" },
        { status: 400 }
      );
    }

    const platform = await getPlatformSettings();
    const fileUrl = await saveStudyMaterialFile(
      file,
      session.user.id,
      platform.maxUploadSizeMb
    );

    const materialTitle = title || file.name;
    const id = await createStudyMaterial({
      tutorId: session.user.id,
      title: materialTitle,
      description: description || null,
      fileUrl,
      fileName: file.name,
      mimeType: file.type || null,
      fileSizeBytes: file.size,
      studentIds,
    });

    const materials = await listTutorMaterials(session.user.id);
    const created = materials.find((m) => m.id === id);

    return NextResponse.json({
      ok: true,
      material: created,
      message: `Shared with ${studentIds.length} student(s)`,
    });
  } catch (error) {
    console.error("Tutor materials POST:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
