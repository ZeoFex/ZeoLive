import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { slugifyLabel } from "@/lib/constants/programmes";
import { prisma } from "@/lib/prisma";

const updateProgrammeSchema = z.object({
  name: z.string().trim().min(2).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const data = updateProgrammeSchema.parse(body);

    const existing = await prisma.programme.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = slugifyLabel(data.name);
      if (!slug) {
        return NextResponse.json(
          { error: "Programme name is invalid" },
          { status: 400 }
        );
      }
      const clash = await prisma.programme.findFirst({
        where: {
          id: { not: id },
          OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }],
        },
      });
      if (clash) {
        return NextResponse.json(
          { error: "A programme with this name already exists" },
          { status: 409 }
        );
      }
    }

    const programme = await prisma.programme.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
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
    console.error("Admin update programme error:", error);
    return NextResponse.json(
      { error: "Could not update programme" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  try {
    const existing = await prisma.programme.findUnique({
      where: { id },
      include: { _count: { select: { tutors: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    if (existing._count.tutors > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a programme that tutors have selected. Deactivate it instead.",
        },
        { status: 400 }
      );
    }

    await prisma.programme.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete programme error:", error);
    return NextResponse.json(
      { error: "Could not delete programme" },
      { status: 500 }
    );
  }
}
