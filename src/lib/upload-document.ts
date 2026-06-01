import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isCloudinaryConfigured, uploadFileFromBuffer } from "@/lib/cloudinary";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return "File must be 10MB or smaller";
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return "Upload a PDF or image (JPG, PNG, WebP)";
  }
  return null;
}

async function saveToLocalDisk(file: File, subfolder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
  const filename = `${randomBytes(16).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subfolder}/${filename}`;
}

export async function saveUploadedFile(
  file: File,
  subfolder: string
): Promise<string> {
  const validationError = validateUploadFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (isCloudinaryConfigured()) {
    try {
      return await uploadFileFromBuffer(file, subfolder);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Could not upload file to storage");
    }
  }

  try {
    return await saveToLocalDisk(file, subfolder);
  } catch (error) {
    console.error("Local upload error:", error);
    const hint =
      process.env.VERCEL === "1"
        ? "File storage is not available in this environment. Configure Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
        : "Could not save file on the server";
    throw new Error(hint);
  }
}
