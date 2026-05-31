import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") ?? "zoelive/uploads";

  try {
    const signature = getUploadSignature(folder);
    return NextResponse.json(signature);
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 });
  }
}
