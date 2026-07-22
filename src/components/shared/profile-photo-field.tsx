"use client";

import { Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { prepareProfilePhoto } from "@/lib/prepare-profile-photo";
import { cn } from "@/lib/utils";

interface ProfilePhotoFieldProps {
  imageUrl?: string | null;
  name?: string;
  onUploaded: (url: string) => void | Promise<void>;
  className?: string;
}

export function ProfilePhotoField({
  imageUrl,
  name,
  onUploaded,
  className,
}: ProfilePhotoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const initials = (name?.trim()?.[0] ?? "?").toUpperCase();

  const upload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Upload an image (JPG, PNG, or WebP)");
        return;
      }

      setUploading(true);
      try {
        const prepared = await prepareProfilePhoto(file);
        const form = new FormData();
        form.append("file", prepared);
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          body: form,
          credentials: "same-origin",
        });
        const json = (await res.json().catch(() => ({}))) as {
          image?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Could not upload photo");
        }
        if (!json.image) {
          throw new Error("Upload succeeded but no image URL was returned");
        }
        await onUploaded(json.image);
        toast.success("Profile photo updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      <Avatar className="h-20 w-20 border border-slate-200 shadow-sm">
        {imageUrl ? <AvatarImage src={imageUrl} alt={name ?? "Profile photo"} /> : null}
        <AvatarFallback className="bg-sky-100 text-xl font-semibold text-blue-700">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "relative flex min-h-[96px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 transition-colors",
          dragOver
            ? "border-blue-500 bg-sky-50"
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-sky-50/60",
          uploading && "pointer-events-none opacity-70"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload profile photo"
          disabled={uploading}
          onChange={(e) => {
            void upload(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600" />
        ) : (
          <Upload className="mb-2 h-6 w-6 text-slate-500" />
        )}
        <p className="text-sm font-semibold text-slate-800">
          {uploading ? "Uploading…" : "Update profile photo"}
        </p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP · drag & drop or click</p>
      </div>
    </div>
  );
}
