import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
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

    const platform = await getPlatformSettings();
    const url = await saveUploadedFile(file, folder, platform.maxUploadSizeMb);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Document upload error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("10MB") || message.includes("PDF or image")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
