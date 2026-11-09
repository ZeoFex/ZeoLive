import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { brandedRecordingLabel, getRecordingForUser } from "@/lib/recordings";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const recording = await getRecordingForUser({
    recordingId: id,
    userId: session.user.id,
    role: session.user.role,
  });

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  return NextResponse.json({
    recording: {
      id: recording.id,
      title: brandedRecordingLabel(recording.title),
      description: recording.description,
      fileUrl: recording.fileUrl,
      fileName: recording.fileName,
      mimeType: recording.mimeType,
      subject: recording.tutoringSession.subject,
      sessionTitle: recording.tutoringSession.title,
      scheduledAt: recording.tutoringSession.scheduledAt.toISOString(),
    },
  });
}
