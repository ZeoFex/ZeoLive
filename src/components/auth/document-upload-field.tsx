"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";

interface DocumentUploadFieldProps {
  label: string;
  accept?: string;
  folder: string;
  value?: string;
  onUploaded: (url: string) => void;
  className?: string;
}

export function DocumentUploadField({
  label,
  accept,
  folder,
  value,
  onUploaded,
  className,
}: DocumentUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload/document", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed");
      }
      onUploaded(json.url as string);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <FileUpload
        label={uploading ? `Uploading ${label}…` : label}
        accept={accept}
        onFileSelect={handleFile}
      />
      {value && (
        <p className="text-xs text-muted-foreground truncate">Uploaded: {value}</p>
      )}
    </div>
  );
}
