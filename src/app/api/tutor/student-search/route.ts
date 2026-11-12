import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/portal-data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ students: [] });
  }

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    students: students.map((student) => ({
      id: student.id,
      name: displayUserName(student),
      email: student.email,
      image: student.image,
    })),
  });
}
