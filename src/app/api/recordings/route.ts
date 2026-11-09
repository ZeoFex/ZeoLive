import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listRecordingsForUser } from "@/lib/recordings";
import { saveRecordingFile } from "@/lib/upload-document";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.user.role !== "STUDENT" &&
    session.user.role !== "TUTOR" &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recordings = await listRecordingsForUser({
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Recordings GET:", error);
    return NextResponse.json({ error: "Could not load recordings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TUTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only tutors or admins can upload recordings" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const tutoringSessionId = String(form.get("tutoringSessionId") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }
    if (!tutoringSessionId) {
      return NextResponse.json({ error: "Select a session for this recording" }, { status: 400 });
    }

    const tutoringSession = await prisma.tutoringSession.findUnique({
      where: { id: tutoringSessionId },
      select: { id: true, tutorId: true, title: true, subject: true, status: true },
    });

    if (!tutoringSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (
      session.user.role === "TUTOR" &&
      tutoringSession.tutorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You can only upload recordings for your own sessions" },
        { status: 403 }
      );
    }

    const fileUrl = await saveRecordingFile(file, tutoringSession.id, 200);
    const recording = await prisma.sessionRecording.create({
      data: {
        tutoringSessionId: tutoringSession.id,
        uploadedById: session.user.id,
        title:
          title ||
          tutoringSession.title ||
          tutoringSession.subject ||
          "Session recording",
        description: description || null,
        fileUrl,
        fileName: file.name,
        mimeType: file.type || "video/mp4",
        fileSizeBytes: file.size,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ ok: true, recordingId: recording.id });
  } catch (error) {
    console.error("Recordings POST:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
