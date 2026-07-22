import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_TIMEOUT_MS = 20_000;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    timeout: CLOUDINARY_TIMEOUT_MS,
  });
  return cloudinary;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function uploadImage(
  file: string,
  folder = "zoelive/images"
) {
  const cld = getCloudinary();
  return cld.uploader.upload(file, {
    folder,
    resource_type: "image",
    timeout: CLOUDINARY_TIMEOUT_MS,
  });
}

function uploadBufferOnce(file: File, folder: string): Promise<string> {
  const cld = getCloudinary();
  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "auto";

  return file.arrayBuffer().then((bytes) => {
    const buffer = Buffer.from(bytes);
    return new Promise<string>((resolve, reject) => {
      const stream = cld.uploader.upload_stream(
        {
          folder: `zoelive/${folder}`,
          resource_type: resourceType,
          format: isImage && file.type === "image/jpeg" ? "jpg" : undefined,
          timeout: CLOUDINARY_TIMEOUT_MS,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (!result?.secure_url) {
            reject(new Error("Cloudinary did not return a URL"));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  });
}

/** Server-side upload from a browser File (verification documents, live photo, etc.). */
export async function uploadFileFromBuffer(
  file: File,
  folder: string
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await withTimeout(
        uploadBufferOnce(file, folder),
        CLOUDINARY_TIMEOUT_MS,
        "Cloudinary upload"
      );
    } catch (error) {
      lastError = error;
      console.error(`Cloudinary upload attempt ${attempt} failed:`, error);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Cloudinary upload failed");
}

export async function uploadVideo(
  file: string,
  folder = "zoelive/videos"
) {
  const cld = getCloudinary();
  return cld.uploader.upload(file, {
    folder,
    resource_type: "video",
    timeout: CLOUDINARY_TIMEOUT_MS,
  });
}

export function getUploadSignature(folder: string) {
  const cld = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cld.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}
