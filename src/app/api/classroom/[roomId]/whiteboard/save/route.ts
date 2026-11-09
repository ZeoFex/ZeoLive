import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { saveSessionWhiteboard } from "@/lib/study-materials";
import { saveStudyMaterialFile } from "@/lib/upload-document";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const access = await verifyClassroomAccess(roomId, session.user.id, session.user.role);
  if (!access.allowed || !access.session || access.participantRole !== "tutor") {
    return NextResponse.json(
      { error: access.participantRole === "student" ? "Only the tutor can save the whiteboard" : (access.error ?? "Access denied") },
      { status: access.allowed ? 403 : access.status }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Whiteboard image is missing" }, { status: 400 });
  }

  let extraStudentIds: string[] = [];
  const rawIds = form?.get("studentIds");
  if (typeof rawIds === "string" && rawIds) {
    try {
      const parsed = JSON.parse(rawIds) as unknown;
      if (Array.isArray(parsed)) {
        extraStudentIds = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      extraStudentIds = [];
    }
  }

  try {
    const fileUrl = await saveStudyMaterialFile(file, access.session.tutorId, 12);
    const lessonTitle = access.session.title?.trim() || access.session.subject?.trim() || "Lesson";
    const materialId = await saveSessionWhiteboard({
      tutorId: access.session.tutorId,
      studentId: access.session.studentId,
      roomId,
      title: `${lessonTitle} whiteboard`,
      fileUrl,
      mimeType: file.type || "image/jpeg",
      fileSizeBytes: file.size,
      extraStudentIds,
    });

    return NextResponse.json({ materialId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the whiteboard";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
