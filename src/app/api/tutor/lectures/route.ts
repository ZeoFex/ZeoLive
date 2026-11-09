import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createLectureVideo, listTutorLectures } from "@/lib/lectures";
import { saveLectureFile } from "@/lib/upload-document";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function tutorId() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") return null;
  return session.user.id;
}

export async function GET() {
  const id = await tutorId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const board = await listTutorLectures(id);
  return NextResponse.json(board);
}

export async function POST(request: Request) {
  const id = await tutorId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const title = typeof form?.get("title") === "string" ? String(form.get("title")).trim() : "";
  const subjectId = typeof form?.get("subjectId") === "string" ? String(form.get("subjectId")) : "";
  const description =
    typeof form?.get("description") === "string" ? String(form.get("description")) : "";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a video to upload" }, { status: 400 });
  }
  if (title.length < 2) {
    return NextResponse.json({ error: "Add a title for this lecture" }, { status: 400 });
  }
  if (!subjectId) {
    return NextResponse.json({ error: "Choose a subject" }, { status: 400 });
  }

  try {
    const fileUrl = await saveLectureFile(file, id);
    const created = await createLectureVideo({
      tutorId: id,
      subjectId,
      title,
      description,
      fileUrl,
      fileName: file.name || "lecture.mp4",
      mimeType: file.type || null,
      fileSizeBytes: file.size,
    });
    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: created.status });
    }
    return NextResponse.json({ video: created.video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload the lecture";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
