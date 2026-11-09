import { randomBytes } from "crypto";
import type { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { BRAND_NAME } from "@/lib/brand";

export type RecordingListItem = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number;
  durationSeconds: number | null;
  createdAt: string;
  subject: string | null;
  sessionTitle: string | null;
  scheduledAt: string;
  studentName: string;
  tutorName: string;
  studentEmail: string;
  tutorEmail: string;
  canDownloadRequest: boolean;
  downloadRequest: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DOWNLOADED";
    accessCode: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
};

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.name?.trim() || composed || user.email;
}

export function canWatchRecording(args: {
  role: Role;
  userId: string;
  studentId: string;
  tutorId: string;
}) {
  if (args.role === "ADMIN" || args.role === "TUTOR") return true;
  if (args.role === "STUDENT") return args.userId === args.studentId;
  return false;
}

export function generateRecordingAccessCode() {
  return `ZTL-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function generateDownloadToken() {
  return randomBytes(24).toString("hex");
}

export async function listRecordingsForUser(args: {
  userId: string;
  role: Role;
}): Promise<RecordingListItem[]> {
  const where =
    args.role === "STUDENT"
      ? { tutoringSession: { studentId: args.userId } }
      : {};

  const recordings = await prisma.sessionRecording.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tutoringSession: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tutor: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      downloadRequests: {
        where: { requesterId: args.userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return recordings.map((recording) => {
    const latest = recording.downloadRequests[0] ?? null;
    return {
      id: recording.id,
      title: recording.title,
      description: recording.description,
      fileName: recording.fileName,
      mimeType: recording.mimeType,
      fileSizeBytes: recording.fileSizeBytes,
      durationSeconds: recording.durationSeconds,
      createdAt: recording.createdAt.toISOString(),
      subject: recording.tutoringSession.subject,
      sessionTitle: recording.tutoringSession.title,
      scheduledAt: recording.tutoringSession.scheduledAt.toISOString(),
      studentName: displayName(recording.tutoringSession.student),
      tutorName: displayName(recording.tutoringSession.tutor),
      studentEmail: recording.tutoringSession.student.email,
      tutorEmail: recording.tutoringSession.tutor.email,
      canDownloadRequest: args.role === "STUDENT" || args.role === "TUTOR",
      downloadRequest: latest
        ? {
            id: latest.id,
            status: latest.status,
            accessCode: latest.accessCode,
            createdAt: latest.createdAt.toISOString(),
            reviewedAt: latest.reviewedAt?.toISOString() ?? null,
          }
        : null,
    };
  });
}

export async function getRecordingForUser(args: {
  recordingId: string;
  userId: string;
  role: Role;
}) {
  const recording = await prisma.sessionRecording.findUnique({
    where: { id: args.recordingId },
    include: {
      tutoringSession: {
        select: {
          id: true,
          studentId: true,
          tutorId: true,
          title: true,
          subject: true,
          scheduledAt: true,
        },
      },
    },
  });

  if (!recording) return null;

  if (
    !canWatchRecording({
      role: args.role,
      userId: args.userId,
      studentId: recording.tutoringSession.studentId,
      tutorId: recording.tutoringSession.tutorId,
    })
  ) {
    return null;
  }

  return recording;
}

export function brandedRecordingLabel(title: string) {
  return `${BRAND_NAME} · ${title}`;
}
