import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, validateUploadFile } from "@/lib/upload-document";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const record = await prisma.tutorRecommendation.findUnique({
    where: { token },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (record.submittedAt) {
    return NextResponse.json(
      { error: "Recommendation already submitted" },
      { status: 409 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (file.type && !allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Upload a PDF or image (JPG, PNG, WebP)" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be 10MB or smaller" },
        { status: 400 }
      );
    }

    const url = await saveUploadedFile(
      file,
      `recommendations/${record.tutorProfileId}`
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Recommendation upload error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("10MB") || message.includes("PDF or image")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
