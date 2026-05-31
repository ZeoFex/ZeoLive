"use client";

import { Camera, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LivePhotoCaptureProps {
  label?: string;
  folder?: string;
  value?: string;
  onCaptured: (url: string) => void;
  className?: string;
}

export function LivePhotoCapture({
  label = "Live photo",
  folder = "tutor/live-photo",
  value,
  onCaptured,
  className,
}: LivePhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (value) setPreviewUrl(value);
  }, [value]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      toast.error("Could not access camera. Allow camera permission and try again.");
    }
  };

  const uploadBlob = async (blob: Blob) => {
    setUploading(true);
    try {
      const file = new File([blob], `live-photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload/document", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed");
      }
      const url = json.url as string;
      setPreviewUrl(url);
      onCaptured(url);
      toast.success("Live photo captured");
      stopCamera();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      toast.error("Camera not ready");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Could not capture photo");
      return;
    }
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });
    if (!blob) {
      toast.error("Could not capture photo");
      return;
    }
    await uploadBlob(blob);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label} *</Label>
      <p className="text-xs text-muted-foreground">
        Use your device camera to take a live photo. This must be captured now — file uploads
        are not accepted for this step.
      </p>

      <div className="overflow-hidden rounded-lg border bg-muted/30">
        {previewUrl && !active ? (
          <div className="relative aspect-[4/3] max-h-72 w-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Captured live photo"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn(
              "aspect-[4/3] max-h-72 w-full bg-black object-cover",
              !active && "hidden"
            )}
          />
        )}
        {!active && !previewUrl && (
          <div className="flex aspect-[4/3] max-h-72 items-center justify-center bg-muted">
            <Camera className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button type="button" variant="outline" size="sm" onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            {previewUrl ? "Retake photo" : "Open camera"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              onClick={capturePhoto}
              disabled={uploading}
            >
              {uploading ? "Saving…" : "Capture photo"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stopCamera}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
      </div>

      {previewUrl && (
        <p className="text-xs text-muted-foreground truncate">Saved: {previewUrl}</p>
      )}
    </div>
  );
}
