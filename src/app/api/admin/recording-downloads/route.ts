import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const result = await requireSuperAdmin();
  if ("error" in result) {
    return result.error;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "PENDING";

  const requests = await prisma.recordingDownloadRequest.findMany({
    where:
      status === "all"
        ? undefined
        : {
            status: status as "PENDING" | "APPROVED" | "REJECTED" | "DOWNLOADED",
          },
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      recording: {
        select: {
          id: true,
          title: true,
          fileName: true,
          tutoringSession: {
            select: {
              subject: true,
              title: true,
              scheduledAt: true,
            },
          },
        },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((item) => ({
      id: item.id,
      status: item.status,
      accessCode: item.accessCode,
      requesterEmail: item.requesterEmail,
      requesterName:
        item.requester.name ||
        [item.requester.firstName, item.requester.lastName].filter(Boolean).join(" ") ||
        item.requester.email,
      requesterRole: item.requester.role,
      createdAt: item.createdAt.toISOString(),
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      downloadedAt: item.downloadedAt?.toISOString() ?? null,
      reviewedByEmail: item.reviewedBy?.email ?? null,
      recording: {
        id: item.recording.id,
        title: item.recording.title,
        fileName: item.recording.fileName,
        subject: item.recording.tutoringSession.subject,
        sessionTitle: item.recording.tutoringSession.title,
        scheduledAt: item.recording.tutoringSession.scheduledAt.toISOString(),
      },
    })),
  });
}
