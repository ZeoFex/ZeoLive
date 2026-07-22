"use client";

import { Camera, CheckCircle2, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  assessLivePhotoQuality,
} from "@/lib/live-photo-quality";
import { uploadDocumentFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

interface LivePhotoCaptureProps {
  label?: string;
  folder?: string;
  value?: string;
  onCaptured: (url: string) => void;
  className?: string;
  compact?: boolean;
}

export function LivePhotoCapture({
  label = "Live photo",
  folder = "tutor/live-photo",
  value,
  onCaptured,
  className,
  compact = false,
}: LivePhotoCaptureProps) {
  const { status: sessionStatus } = useSession();
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
    if (sessionStatus === "unauthenticated") {
      toast.error("Sign in to save your live photo");
      return;
    }
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
    if (sessionStatus === "unauthenticated") {
      toast.error("Sign in to save your live photo");
      return;
    }
    if (sessionStatus === "loading") {
      toast.message("Finishing sign-in… try again in a moment");
      return;
    }

    setUploading(true);
    try {
      const file = new File([blob], `live-photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const url = await uploadDocumentFile(file, folder);
      setPreviewUrl(url);
      onCaptured(url);
      toast.success("Live photo saved");
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

    const quality = assessLivePhotoQuality(canvas);
    if (!quality.ok) {
      toast.error(quality.message, { duration: 6000 });
      return;
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });
    if (!blob) {
      toast.error("Could not capture photo");
      return;
    }
    await uploadBlob(blob);
  };

  const hasPhoto = Boolean(previewUrl && !active);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      <div>
        <Label className="text-sm font-semibold text-slate-800">{label} *</Label>
        {!compact && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Use your device camera now for identity verification. Saved photos cannot be
            uploaded from your gallery.
          </p>
        )}
        {compact && (
          <p className="mt-0.5 text-[11px] text-slate-500">
            Capture with your camera — gallery uploads are not allowed.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        {hasPhoto ? (
          <div
            className={cn(
              "relative w-full bg-slate-100",
              compact ? "aspect-video max-h-40" : "aspect-[4/3] max-h-72"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Captured live photo"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Photo saved
            </span>
          </div>
        ) : (
          <>
            <div className={cn("relative", !active && "hidden")}>
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn(
                  "w-full bg-slate-900 object-cover",
                  compact ? "aspect-video max-h-40" : "aspect-[4/3] max-h-72"
                )}
              />
              {active && (
                <div
                  className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/50"
                  aria-hidden
                />
              )}
            </div>
            {!active && (
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-slate-50 to-slate-100 px-4 text-center",
                  compact ? "aspect-video max-h-40" : "aspect-[4/3] max-h-72"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200",
                    compact ? "h-10 w-10" : "h-14 w-14"
                  )}
                >
                  <Camera className={cn(compact ? "h-5 w-5" : "h-7 w-7", "text-slate-400")} />
                </div>
                <p className={cn("font-medium text-slate-700", compact ? "text-xs" : "text-sm")}>
                  No photo yet
                </p>
                {!compact && (
                  <p className="text-xs text-slate-500">Open your camera when you are ready</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            onClick={startCamera}
            disabled={sessionStatus === "loading"}
          >
            <Camera className="mr-2 h-4 w-4" />
            {hasPhoto ? "Retake photo" : "Open camera"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              className="auth-primary-btn h-9 w-auto px-4"
              onClick={capturePhoto}
              disabled={uploading}
            >
              {uploading ? "Saving…" : "Capture photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              onClick={stopCamera}
              disabled={uploading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
