import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  generateDownloadToken,
  generateRecordingAccessCode,
} from "@/lib/recordings";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const result = await requireSuperAdmin();
  if ("error" in result) {
    return result.error;
  }

  const reviewerId = result.session.user?.id;
  if (!reviewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject";
  };

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.recordingDownloadRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending requests can be reviewed" },
      { status: 400 }
    );
  }

  if (body.action === "reject") {
    const updated = await prisma.recordingDownloadRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, request: updated });
  }

  const accessCode = existing.accessCode || generateRecordingAccessCode();
  const downloadToken = generateDownloadToken();

  const updated = await prisma.recordingDownloadRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      accessCode,
      downloadToken,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: updated.id,
      status: updated.status,
      accessCode: updated.accessCode,
      downloadToken: updated.downloadToken,
      requesterEmail: updated.requesterEmail,
    },
    message: `Approved for ${updated.requesterEmail}. Access code ${accessCode}.`,
  });
}
