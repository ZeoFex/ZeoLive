"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/file-upload";
import { uploadDocumentFile } from "@/lib/upload-client";
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
      const url = await uploadDocumentFile(file, folder);
      onUploaded(url);
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
        className="auth-file-upload"
      />
      {value && (
        <p className="text-xs text-emerald-700">
          ✓ {label} uploaded successfully
        </p>
      )}
    </div>
  );
}
