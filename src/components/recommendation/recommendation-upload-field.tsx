"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/file-upload";

interface RecommendationUploadFieldProps {
  token: string;
  value?: string;
  onUploaded: (url: string) => void;
}

export function RecommendationUploadField({
  token,
  value,
  onUploaded,
}: RecommendationUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/recommendation/${token}/upload`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed");
      }
      onUploaded(json.url as string);
      toast.success("Letter uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <FileUpload
        label={uploading ? "Uploading letter…" : "Upload letter (PDF or image)"}
        accept=".pdf,image/*"
        onFileSelect={handleFile}
      />
      {value && (
        <p className="text-xs text-muted-foreground">
          File ready to submit. You can still add a written note below (optional).
        </p>
      )}
    </div>
  );
}
