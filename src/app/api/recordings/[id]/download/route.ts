import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecordingForUser } from "@/lib/recordings";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const recording = await getRecordingForUser({
    recordingId: id,
    userId: session.user.id,
    role: session.user.role,
  });

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  if (session.user.role === "ADMIN") {
    return NextResponse.json({
      ok: true,
      downloadUrl: recording.fileUrl,
      fileName: recording.fileName,
    });
  }

  const approved = await prisma.recordingDownloadRequest.findFirst({
    where: {
      recordingId: id,
      requesterId: session.user.id,
      status: "APPROVED",
      ...(token ? { downloadToken: token } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!approved || !approved.downloadToken) {
    return NextResponse.json(
      {
        error:
          "Download is locked. Request access and wait for admin approval first.",
      },
      { status: 403 }
    );
  }

  if (token && approved.downloadToken !== token) {
    return NextResponse.json({ error: "Invalid download token" }, { status: 403 });
  }

  await prisma.recordingDownloadRequest.update({
    where: { id: approved.id },
    data: {
      status: "DOWNLOADED",
      downloadedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    downloadUrl: recording.fileUrl,
    fileName: recording.fileName,
    accessCode: approved.accessCode,
  });
}
