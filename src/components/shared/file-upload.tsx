"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
  className?: string;
}

export function FileUpload({
  label,
  accept,
  onFileSelect,
  className,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      setFileName(file?.name ?? null);
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        type="file"
        accept={accept}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        aria-label={label}
      />
      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {fileName ?? "Drag & drop or click to upload"}
      </p>
    </div>
  );
}
