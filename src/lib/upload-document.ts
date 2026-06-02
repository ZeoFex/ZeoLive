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

export async function saveStudyMaterialFile(
  file: File,
  tutorId: string,
  maxMb = DEFAULT_MAX_MB
): Promise<string> {
  const validationError = validateStudyMaterialFile(file, maxMb);
  if (validationError) {
    throw new Error(validationError);
  }

  if (isCloudinaryConfigured()) {
    try {
      return await uploadFileFromBuffer(file, `materials/${tutorId}`);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Could not upload file to storage");
    }
  }

  try {
    return await saveToLocalDisk(file, `materials/${tutorId}`);
  } catch (error) {
    console.error("Local upload error:", error);
    const hint =
      process.env.VERCEL === "1"
        ? "File storage is not available in this environment. Configure Cloudinary."
        : "Could not save file on the server";
    throw new Error(hint);
  }
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
