/** Resize/compress a profile photo in the browser before upload. */
export async function prepareProfilePhoto(file: File, maxEdge = 800): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Upload an image (JPG, PNG, or WebP)");
  }

  // Small enough already — keep original
  if (file.size <= 350_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82);
    });

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
