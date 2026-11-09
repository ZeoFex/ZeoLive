import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createLectureSubject } from "@/lib/lectures";

async function tutorId() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") return null;
  return session.user.id;
}

export async function POST(request: Request) {
  const id = await tutorId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const result = await createLectureSubject(id, name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({
    subject: { id: result.subject.id, name: result.subject.name, videoCount: 0 },
    created: result.created,
  });
}
