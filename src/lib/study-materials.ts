import { listTutorStudents } from "@/lib/portal-data";
import { displayUserName } from "@/lib/portal-data";
import { prisma } from "@/lib/prisma";

export type StudyMaterialDto = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number;
  fileSizeLabel: string;
  createdAt: string;
  shareCount: number;
  shares: {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    sharedAt: string;
    viewedAt: string | null;
  }[];
};

export type StudentMaterialDto = {
  shareId: string;
  materialId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSizeLabel: string;
  sharedAt: string;
  viewedAt: string | null;
  isNew: boolean;
  tutor: {
    id: string;
    name: string;
    image: string | null;
  };
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function tutorStudentIds(tutorId: string): Promise<Set<string>> {
  const students = await listTutorStudents(tutorId);
  return new Set(students.map((s) => s.id));
}

export async function listTutorMaterials(tutorId: string): Promise<StudyMaterialDto[]> {
  const rows = await prisma.studyMaterial.findMany({
    where: { tutorId },
    orderBy: { createdAt: "desc" },
    include: {
      shares: {
        include: {
          student: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { sharedAt: "desc" },
      },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    mimeType: m.mimeType,
    fileSizeBytes: m.fileSizeBytes,
    fileSizeLabel: formatFileSize(m.fileSizeBytes),
    createdAt: m.createdAt.toISOString(),
    shareCount: m.shares.length,
    shares: m.shares.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: displayUserName(s.student),
      studentEmail: s.student.email,
      sharedAt: s.sharedAt.toISOString(),
      viewedAt: s.viewedAt?.toISOString() ?? null,
    })),
  }));
}

export async function createStudyMaterial(input: {
  tutorId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  fileSizeBytes: number;
  studentIds: string[];
}) {
  const allowed = await tutorStudentIds(input.tutorId);
  const studentIds = input.studentIds.filter((id) => allowed.has(id));

  const material = await prisma.studyMaterial.create({
    data: {
      tutorId: input.tutorId,
      title: input.title,
      description: input.description ?? null,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes,
      shares:
        studentIds.length > 0
          ? {
              create: studentIds.map((studentId) => ({ studentId })),
            }
          : undefined,
    },
  });

  return material.id;
}

export async function shareMaterialWithStudents(
  materialId: string,
  tutorId: string,
  studentIds: string[]
) {
  const material = await prisma.studyMaterial.findFirst({
    where: { id: materialId, tutorId },
  });
  if (!material) {
    return { ok: false as const, status: 404, error: "Material not found" };
  }

  const allowed = await tutorStudentIds(tutorId);
  const validIds = studentIds.filter((id) => allowed.has(id));

  if (validIds.length === 0) {
    return {
      ok: false as const,
      status: 400,
      error: "Select at least one student who has booked with you",
    };
  }

  await prisma.materialShare.createMany({
    data: validIds.map((studentId) => ({ materialId, studentId })),
    skipDuplicates: true,
  });

  return { ok: true as const, shared: validIds.length };
}

export async function deleteStudyMaterial(materialId: string, tutorId: string) {
  const result = await prisma.studyMaterial.deleteMany({
    where: { id: materialId, tutorId },
  });
  return result.count > 0;
}

export async function listStudentMaterials(studentId: string): Promise<StudentMaterialDto[]> {
  const shares = await prisma.materialShare.findMany({
    where: { studentId },
    orderBy: { sharedAt: "desc" },
    include: {
      material: {
        include: {
          tutor: {
            select: {
              id: true,
              email: true,
              image: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return shares.map((s) => ({
    shareId: s.id,
    materialId: s.materialId,
    title: s.material.title,
    description: s.material.description,
    fileUrl: s.material.fileUrl,
    fileName: s.material.fileName,
    fileSizeLabel: formatFileSize(s.material.fileSizeBytes),
    sharedAt: s.sharedAt.toISOString(),
    viewedAt: s.viewedAt?.toISOString() ?? null,
    isNew: !s.viewedAt,
    tutor: {
      id: s.material.tutor.id,
      name: displayUserName(s.material.tutor),
      image: s.material.tutor.image,
    },
  }));
}

export async function markMaterialViewed(shareId: string, studentId: string) {
  const updated = await prisma.materialShare.updateMany({
    where: { id: shareId, studentId },
    data: { viewedAt: new Date() },
  });
  return updated.count > 0;
}

export async function countUnviewedMaterials(studentId: string) {
  return prisma.materialShare.count({
    where: { studentId, viewedAt: null },
  });
}
