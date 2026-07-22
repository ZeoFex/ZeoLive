import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isCloudinaryConfigured, uploadFileFromBuffer } from "@/lib/cloudinary";

const DEFAULT_MAX_MB = 10;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const STUDY_MATERIAL_TYPES = new Set([
  ...ALLOWED_TYPES,
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

function canUseLocalDiskFallback() {
  // Vercel’s filesystem is ephemeral / not durable for user uploads
  return process.env.VERCEL !== "1";
}

function isTransientCloudinaryError(error: unknown) {
  if (!(error instanceof Error)) return true;
  const message = `${error.message} ${"code" in error ? String((error as { code?: string }).code) : ""}`;
  return /ETIMEDOUT|ESOCKETTIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|timed out|socket hang up|network/i.test(
    message
  );
}

export function validateStudyMaterialFile(file: File, maxMb = DEFAULT_MAX_MB): string | null {
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File must be ${maxMb}MB or smaller`;
  }
  if (file.type && !STUDY_MATERIAL_TYPES.has(file.type)) {
    return "Upload a PDF, Word document, PowerPoint, image, or text file";
  }
  if (!file.type && file.name) {
    const ext = path.extname(file.name).toLowerCase();
    const allowedExt = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".webp", ".txt"];
    if (!allowedExt.includes(ext)) {
      return "Upload a PDF, Word document, PowerPoint, image, or text file";
    }
  }
  return null;
}

export function validateUploadFile(file: File, maxMb = DEFAULT_MAX_MB): string | null {
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File must be ${maxMb}MB or smaller`;
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

async function uploadWithCloudinaryFallback(
  file: File,
  subfolder: string
): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      return await uploadFileFromBuffer(file, subfolder);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      if (canUseLocalDiskFallback() && isTransientCloudinaryError(error)) {
        console.warn(
          "Cloudinary unavailable; saving upload to local disk instead:",
          subfolder
        );
        return saveToLocalDisk(file, subfolder);
      }
      if (canUseLocalDiskFallback()) {
        console.warn(
          "Cloudinary failed; falling back to local disk:",
          subfolder
        );
        return saveToLocalDisk(file, subfolder);
      }
      throw new Error(
        "Could not upload file to storage. Check Cloudinary credentials and network, then try again."
      );
    }
  }

  if (!canUseLocalDiskFallback()) {
    throw new Error(
      "File storage is not available in this environment. Configure Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }

  try {
    return await saveToLocalDisk(file, subfolder);
  } catch (error) {
    console.error("Local upload error:", error);
    throw new Error("Could not save file on the server");
  }
}

export async function saveStudyMaterialFile(
  file: File,
  tutorId: string,
  maxMb = DEFAULT_MAX_MB
): Promise<string> {
  const validationError = validateStudyMaterialFile(file, maxMb);
  if (validationError) {
    throw new Error(validationError);
  }

  return uploadWithCloudinaryFallback(file, `materials/${tutorId}`);
}

export async function saveUploadedFile(
  file: File,
  subfolder: string,
  maxMb = DEFAULT_MAX_MB
): Promise<string> {
  const validationError = validateUploadFile(file, maxMb);
  if (validationError) {
    throw new Error(validationError);
  }

  return uploadWithCloudinaryFallback(file, subfolder);
}
