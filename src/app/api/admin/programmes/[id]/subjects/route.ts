import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { slugifyLabel } from "@/lib/constants/programmes";
import { prisma } from "@/lib/prisma";

const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const { id: programmeId } = await context.params;

  try {
    const body = await request.json();
    const data = createSubjectSchema.parse(body);
    const slug = slugifyLabel(data.name);

    if (!slug) {
      return NextResponse.json({ error: "Subject name is invalid" }, { status: 400 });
    }

    const programme = await prisma.programme.findUnique({ where: { id: programmeId } });
    if (!programme) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    const clash = await prisma.subject.findFirst({
      where: {
        programmeId,
        OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }],
      },
    });
    if (clash) {
      return NextResponse.json(
        { error: "This subject already exists on the programme" },
        { status: 409 }
      );
    }

    const maxSort = await prisma.subject.aggregate({
      where: { programmeId },
      _max: { sortOrder: true },
    });

    const subject = await prisma.subject.create({
      data: {
        programmeId,
        name: data.name.trim(),
        slug,
        active: data.active ?? true,
        sortOrder: data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
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
    console.error("Admin create subject error:", error);
    return NextResponse.json(
      { error: "Could not create subject" },
      { status: 500 }
    );
  }
}
