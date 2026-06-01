import { v2 as cloudinary } from "cloudinary";

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
  });
  return cloudinary;
}

export async function uploadImage(
  file: string,
  folder = "zoelive/images"
) {
  const cld = getCloudinary();
  return cld.uploader.upload(file, {
    folder,
    resource_type: "image",
  });
}

/** Server-side upload from a browser File (verification documents, live photo, etc.). */
export async function uploadFileFromBuffer(
  file: File,
  folder: string
): Promise<string> {
  const cld = getCloudinary();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "auto";

  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: `zoelive/${folder}`,
        resource_type: resourceType,
        format: isImage && file.type === "image/jpeg" ? "jpg" : undefined,
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
}

export async function uploadVideo(
  file: string,
  folder = "zoelive/videos"
) {
  const cld = getCloudinary();
  return cld.uploader.upload(file, {
    folder,
    resource_type: "video",
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
