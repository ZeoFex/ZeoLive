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
