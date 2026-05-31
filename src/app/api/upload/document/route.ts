import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveUploadedFile } from "@/lib/upload-document";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder =
      (form.get("folder") as string) || `users/${session.user.id}`;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await saveUploadedFile(file, folder);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
