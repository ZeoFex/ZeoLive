import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { prisma } from "@/lib/prisma";
import { saveRecordingFile } from "@/lib/upload-document";

export const dynamic = "force-dynamic";

const MAX_MB = 400;

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
      {
        error:
          access.participantRole === "student"
            ? "Only the tutor can record this lesson"
            : (access.error ?? "Access denied"),
      },
      { status: access.allowed ? 403 : access.status }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Recording file is missing" }, { status: 400 });
  }

  const durationRaw = Number(form?.get("durationSeconds"));
  const durationSeconds =
    Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : null;

  try {
    const tutoring = access.session;
    const fileUrl = await saveRecordingFile(file, tutoring.id, MAX_MB);
    const title =
      tutoring.title?.trim() ||
      tutoring.subject?.trim() ||
      "Live lesson recording";

    const recording = await prisma.sessionRecording.create({
      data: {
        tutoringSessionId: tutoring.id,
        uploadedById: session.user.id,
        title,
        description: "Recorded live in the classroom",
        fileUrl,
        fileName: file.name || "lesson-recording.webm",
        mimeType: file.type || "video/webm",
        fileSizeBytes: file.size,
        durationSeconds,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ ok: true, recordingId: recording.id });
  } catch (error) {
    console.error("Classroom recording POST:", error);
    const message = error instanceof Error ? error.message : "Could not save recording";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
