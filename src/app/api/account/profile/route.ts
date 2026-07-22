import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { saveUploadedFile } from "@/lib/upload-document";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  image: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v),
      "Invalid image URL"
    )
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name ?? "",
    email: user.email,
    image: user.image ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Multipart profile photo upload
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Upload an image (JPG, PNG, or WebP)" },
          { status: 400 }
        );
      }

      const platform = await getPlatformSettings();
      const imageUrl = await saveUploadedFile(
        file,
        `avatars/${session.user.id}`,
        platform.maxUploadSizeMb
      );

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { image: imageUrl },
        select: { name: true, email: true, image: true },
      });

      return NextResponse.json({
        name: user.name ?? "",
        email: user.email,
        image: user.image ?? "",
      });
    }

    const body = patchSchema.parse(await request.json());
    const data: { name?: string; image?: string | null } = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.image !== undefined) data.image = body.image || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { name: true, email: true, image: true },
    });

    return NextResponse.json({
      name: user.name ?? "",
      email: user.email,
      image: user.image ?? "",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }
    console.error("Account profile PATCH:", error);
    const message =
      error instanceof Error ? error.message : "Could not update profile";
    const status =
      message.includes("MB") || message.includes("image") || message.includes("PDF")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
