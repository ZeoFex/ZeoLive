import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";
import { addSessionMaterial } from "@/lib/study-materials";
import { saveStudyMaterialFile } from "@/lib/upload-document";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId } = await params;
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: { participants: { select: { studentId: true } } },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const isTutor = session.tutorId === authSession.user.id || authSession.user.role === "ADMIN";
    if (!isTutor) {
      return NextResponse.json({ error: "Only the tutor can add files to this class" }, { status: 403 });
    }
    if (session.status === "CANCELLED") {
      return NextResponse.json({ error: "This session was cancelled" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file to share" }, { status: 400 });
    }
    const title = String(form.get("title") ?? "").trim() || file.name || "Class file";
    const fileUrl = await saveStudyMaterialFile(file, session.tutorId);
    await addSessionMaterial({
      sessionId: session.id,
      tutorId: session.tutorId,
      studentIds: [session.studentId, ...session.participants.map((row) => row.studentId)],
      title,
      fileUrl,
      fileName: file.name || "class-file",
      mimeType: file.type || null,
      fileSizeBytes: file.size,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add this file";
    if (message.startsWith("File must be") || message.startsWith("Upload a")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    reportError("session-material", error);
    return NextResponse.json({ error: "Could not add this file" }, { status: 500 });
  }
}
