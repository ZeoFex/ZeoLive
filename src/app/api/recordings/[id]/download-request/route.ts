import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateRecordingAccessCode,
  getRecordingForUser,
} from "@/lib/recordings";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TUTOR") {
    return NextResponse.json(
      { error: "Only students and tutors can request downloads" },
      { status: 403 }
    );
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

  const existing = await prisma.recordingDownloadRequest.findFirst({
    where: {
      recordingId: id,
      requesterId: session.user.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.status === "PENDING") {
    return NextResponse.json({
      ok: true,
      request: {
        id: existing.id,
        status: existing.status,
        accessCode: existing.accessCode,
      },
      message: "Your download request is already waiting for admin approval.",
    });
  }

  if (existing?.status === "APPROVED") {
    return NextResponse.json({
      ok: true,
      request: {
        id: existing.id,
        status: existing.status,
        accessCode: existing.accessCode,
        downloadToken: existing.downloadToken,
      },
      message: "Your download was already approved.",
    });
  }

  const accessCode = generateRecordingAccessCode();
  const created = await prisma.recordingDownloadRequest.create({
    data: {
      recordingId: id,
      requesterId: session.user.id,
      requesterEmail: session.user.email.toLowerCase(),
      status: "PENDING",
      accessCode,
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: created.id,
      status: created.status,
      accessCode: created.accessCode,
    },
    message: "Download request sent. An admin must approve it before download starts.",
  });
}
