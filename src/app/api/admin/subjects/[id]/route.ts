import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { slugifyLabel } from "@/lib/constants/programmes";
import { prisma } from "@/lib/prisma";

const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
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
    const data = updateSubjectSchema.parse(body);

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = slugifyLabel(data.name);
      if (!slug) {
        return NextResponse.json({ error: "Subject name is invalid" }, { status: 400 });
      }
      const clash = await prisma.subject.findFirst({
        where: {
          programmeId: existing.programmeId,
          id: { not: id },
          OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }],
        },
      });
      if (clash) {
        return NextResponse.json(
          { error: "This subject already exists on the programme" },
          { status: 409 }
        );
      }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });

    return NextResponse.json({ subject });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Admin update subject error:", error);
    return NextResponse.json(
      { error: "Could not update subject" },
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
    const existing = await prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { tutorSubjects: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    if (existing._count.tutorSubjects > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a subject tutors already teach. Deactivate it instead.",
        },
        { status: 400 }
      );
    }

    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete subject error:", error);
    return NextResponse.json(
      { error: "Could not delete subject" },
      { status: 500 }
    );
  }
}
