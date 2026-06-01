/** Client-side upload to `/api/upload/document` with clear error messages. */
export async function uploadDocumentFile(
  file: File,
  folder: string
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload/document", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  let json: { url?: string; error?: string } = {};
  try {
    json = await res.json();
  } catch {
    throw new Error(
      res.status === 401
        ? "Please sign in to upload files"
        : "Upload failed — try again"
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Please sign in to upload files");
    }
    throw new Error(json.error ?? "Upload failed");
  }

  if (!json.url) {
    throw new Error("Upload succeeded but no file URL was returned");
  }

  return json.url;
}
