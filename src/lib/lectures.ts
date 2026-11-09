import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/portal-data";
import { formatFileSize } from "@/lib/study-materials";

export function subjectKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type LectureSubjectDto = {
  id: string;
  name: string;
  videoCount: number;
};

export type LectureVideoDto = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSizeLabel: string;
  mimeType: string | null;
  subjectId: string;
  subjectName: string;
  createdAt: string;
  tutor?: {
    id: string;
    name: string;
    image: string | null;
  };
};

async function ensureProvidedSubjects(tutorId: string) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
    select: { subjects: true },
  });

  for (const raw of profile?.subjects ?? []) {
    const name = raw.trim();
    const nameKey = subjectKey(name);
    if (!nameKey) continue;
    await prisma.lectureSubject.upsert({
      where: { tutorId_nameKey: { tutorId, nameKey } },
      update: {},
      create: { tutorId, name, nameKey },
    });
  }
}

export async function listTutorLectures(tutorId: string) {
  await ensureProvidedSubjects(tutorId);

  const subjects = await prisma.lectureSubject.findMany({
    where: { tutorId },
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });

  const videos = await prisma.lectureVideo.findMany({
    where: { tutorId },
    orderBy: { createdAt: "desc" },
    include: { subject: { select: { id: true, name: true } } },
  });

  return {
    subjects: subjects.map(
      (subject): LectureSubjectDto => ({
        id: subject.id,
        name: subject.name,
        videoCount: subject._count.videos,
      })
    ),
    videos: videos.map((video) => toVideoDto(video)),
  };
}

export async function createLectureSubject(tutorId: string, rawName: string) {
  const name = rawName.trim().replace(/\s+/g, " ");
  const nameKey = subjectKey(name);
  if (name.length < 2 || name.length > 60) {
    return { ok: false as const, status: 400, error: "Subject name must be 2–60 characters" };
  }

  const existing = await prisma.lectureSubject.findUnique({
    where: { tutorId_nameKey: { tutorId, nameKey } },
  });
  if (existing) return { ok: true as const, subject: existing, created: false };

  const subject = await prisma.lectureSubject.create({
    data: { tutorId, name, nameKey },
  });
  return { ok: true as const, subject, created: true };
}

export async function deleteLectureSubject(tutorId: string, subjectId: string) {
  const subject = await prisma.lectureSubject.findFirst({
    where: { id: subjectId, tutorId },
    include: { _count: { select: { videos: true } } },
  });
  if (!subject) return { ok: false as const, status: 404, error: "Subject not found" };
  if (subject._count.videos > 0) {
    return {
      ok: false as const,
      status: 400,
      error: "Delete the videos in this subject before removing it",
    };
  }
  await prisma.lectureSubject.delete({ where: { id: subject.id } });
  return { ok: true as const };
}

export async function createLectureVideo(input: {
  tutorId: string;
  subjectId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  fileSizeBytes: number;
}) {
  const subject = await prisma.lectureSubject.findFirst({
    where: { id: input.subjectId, tutorId: input.tutorId },
  });
  if (!subject) return { ok: false as const, status: 400, error: "Choose one of your subjects" };

  const video = await prisma.lectureVideo.create({
    data: {
      tutorId: input.tutorId,
      subjectId: subject.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes,
    },
    include: { subject: { select: { id: true, name: true } } },
  });

  return { ok: true as const, video: toVideoDto(video) };
}

export async function deleteLectureVideo(tutorId: string, videoId: string) {
  const result = await prisma.lectureVideo.deleteMany({
    where: { id: videoId, tutorId },
  });
  return result.count > 0;
}

export async function listStudentLectures(studentId: string) {
  const sessions = await prisma.tutoringSession.findMany({
    where: {
      studentId,
      status: { not: "CANCELLED" },
      subject: { not: null },
    },
    select: { tutorId: true, subject: true },
  });

  const pairs = new Map<string, { tutorId: string; nameKey: string }>();
  for (const session of sessions) {
    const nameKey = subjectKey(session.subject ?? "");
    if (!nameKey) continue;
    pairs.set(`${session.tutorId}:${nameKey}`, { tutorId: session.tutorId, nameKey });
  }

  if (pairs.size === 0) return [];

  const videos = await prisma.lectureVideo.findMany({
    where: {
      OR: [...pairs.values()].map((pair) => ({
        tutorId: pair.tutorId,
        subject: { nameKey: pair.nameKey },
      })),
    },
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { id: true, name: true } },
      tutor: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return videos.map((video) =>
    toVideoDto(video, {
      id: video.tutor.id,
      name: displayUserName(video.tutor),
      image: video.tutor.image,
    })
  );
}

export async function tutorTeachesSubject(tutorId: string, rawName: string) {
  const nameKey = subjectKey(rawName);
  if (!nameKey) return false;

  const [profile, lectureSubject] = await Promise.all([
    prisma.tutorProfile.findUnique({
      where: { userId: tutorId },
      select: { subjects: true },
    }),
    prisma.lectureSubject.findUnique({
      where: { tutorId_nameKey: { tutorId, nameKey } },
      select: { id: true },
    }),
  ]);

  if (lectureSubject) return true;
  const provided = profile?.subjects ?? [];
  if (provided.some((name) => subjectKey(name) === nameKey)) return true;
  if (nameKey !== "general" || provided.length > 0) return false;

  const customCount = await prisma.lectureSubject.count({ where: { tutorId } });
  return customCount === 0;
}

function toVideoDto(
  video: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string | null;
    subjectId: string;
    createdAt: Date;
    subject: { id: string; name: string };
  },
  tutor?: LectureVideoDto["tutor"]
): LectureVideoDto {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    fileUrl: video.fileUrl,
    fileName: video.fileName,
    fileSizeLabel: formatFileSize(video.fileSizeBytes),
    mimeType: video.mimeType,
    subjectId: video.subject.id,
    subjectName: video.subject.name,
    createdAt: video.createdAt.toISOString(),
    tutor,
  };
}
