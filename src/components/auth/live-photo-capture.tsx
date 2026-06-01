"use client";

import { Camera, CheckCircle2, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  assessLivePhotoQuality,
  LIVE_PHOTO_CAPTURE_TIPS,
} from "@/lib/live-photo-quality";
import { uploadDocumentFile } from "@/lib/upload-client";
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
  const { status: sessionStatus } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qualityHint, setQualityHint] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setQualityHint(null);
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
      setQualityHint(null);
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
      setQualityHint(quality.message);
      toast.error(quality.message, { duration: 6000 });
      return;
    }

    setQualityHint(null);

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
    <div className={cn("space-y-3", className)}>
      <div>
        <Label className="text-sm font-semibold text-slate-800">{label} *</Label>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Use your device camera now for identity verification. Saved photos cannot be
          uploaded from your gallery.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        {hasPhoto ? (
          <div className="relative aspect-[4/3] max-h-72 w-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Captured live photo"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm">
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
                className="aspect-[4/3] max-h-72 w-full bg-slate-900 object-cover"
              />
              {active && (
                <div
                  className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/50"
                  aria-hidden
                />
              )}
            </div>
            {!active && (
              <div className="flex aspect-[4/3] max-h-72 flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-50 to-slate-100 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                  <Camera className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No photo yet</p>
                <p className="text-xs text-slate-500">Open your camera when you are ready</p>
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
