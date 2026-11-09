import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { slugifyLabel } from "@/lib/constants/programmes";
import { listAdminProgrammes } from "@/lib/programmes";
import { prisma } from "@/lib/prisma";

const createProgrammeSchema = z.object({
  name: z.string().trim().min(2, "Programme name is required"),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  subjects: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),
});

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const programmes = await listAdminProgrammes();
    return NextResponse.json({
      programmes: programmes.map((programme) => ({
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        active: programme.active,
        sortOrder: programme.sortOrder,
        subjectCount: programme._count.subjects,
        tutorCount: programme._count.tutors,
        subjects: programme.subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          slug: subject.slug,
          active: subject.active,
          sortOrder: subject.sortOrder,
        })),
        createdAt: programme.createdAt.toISOString(),
        updatedAt: programme.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin list programmes error:", error);
    return NextResponse.json(
      { error: "Could not load programmes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const data = createProgrammeSchema.parse(body);
    const slug = slugifyLabel(data.name);

    if (!slug) {
      return NextResponse.json(
        { error: "Programme name is invalid" },
        { status: 400 }
      );
    }

    const existing = await prisma.programme.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A programme with this name already exists" },
        { status: 409 }
      );
    }

    const maxSort = await prisma.programme.aggregate({ _max: { sortOrder: true } });
    const sortOrder = data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1;

    const uniqueSubjects = [
      ...new Map(
        data.subjects
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => [slugifyLabel(name), name] as const)
      ).values(),
    ];

    const programme = await prisma.programme.create({
      data: {
        name: data.name.trim(),
        slug,
        active: data.active ?? true,
        sortOrder,
        subjects: {
          create: uniqueSubjects.map((name, index) => ({
            name,
            slug: slugifyLabel(name),
            active: true,
            sortOrder: index,
          })),
        },
      },
      include: {
        subjects: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        _count: { select: { tutors: true, subjects: true } },
      },
    });

    return NextResponse.json({
      programme: {
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        active: programme.active,
        sortOrder: programme.sortOrder,
        subjectCount: programme._count.subjects,
        tutorCount: programme._count.tutors,
        subjects: programme.subjects,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Admin create programme error:", error);
    return NextResponse.json(
      { error: "Could not create programme" },
      { status: 500 }
    );
  }
}
