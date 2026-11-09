import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROGRAMMES,
  slugifyLabel,
} from "@/lib/constants/programmes";

let seedPromise: Promise<void> | null = null;

/** Idempotent seed of known tertiary programmes and their subjects. */
export async function ensureProgrammesSeeded() {
  if (!seedPromise) {
    seedPromise = seedProgrammes().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}

async function seedProgrammes() {
  for (let i = 0; i < DEFAULT_PROGRAMMES.length; i++) {
    const programme = DEFAULT_PROGRAMMES[i]!;
    const slug = slugifyLabel(programme.name);

    const row = await prisma.programme.upsert({
      where: { slug },
      create: {
        name: programme.name,
        slug,
        active: true,
        sortOrder: i,
      },
      update: {
        name: programme.name,
        active: true,
        sortOrder: i,
      },
    });

    for (let j = 0; j < programme.subjects.length; j++) {
      const subjectName = programme.subjects[j]!;
      const subjectSlug = slugifyLabel(subjectName);
      await prisma.subject.upsert({
        where: {
          programmeId_slug: {
            programmeId: row.id,
            slug: subjectSlug,
          },
        },
        create: {
          programmeId: row.id,
          name: subjectName,
          slug: subjectSlug,
          active: true,
          sortOrder: j,
        },
        update: {
          name: subjectName,
          active: true,
          sortOrder: j,
        },
      });
    }
  }
}

export async function listActiveProgrammesWithSubjects() {
  await ensureProgrammesSeeded();

  return prisma.programme.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subjects: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function listAdminProgrammes() {
  await ensureProgrammesSeeded();

  return prisma.programme.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subjects: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: {
        select: { tutors: true, subjects: true },
      },
    },
  });
}
