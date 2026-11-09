"use client";

import { BRAND_FULL_NAME, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandedRecordingPlayerProps {
  src: string;
  title: string;
  className?: string;
}

export function BrandedRecordingPlayer({
  src,
  title,
  className,
}: BrandedRecordingPlayerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg",
        className
      )}
    >
      <div className="relative aspect-video bg-black">
        <video
          key={src}
          src={src}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          className="h-full w-full"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(145deg,#19b7f5_0%,#0066cc_48%,#004f9a_100%)] text-[0.55rem] font-extrabold tracking-wide text-white">
            {BRAND_NAME}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
            {BRAND_FULL_NAME}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none text-4xl font-extrabold tracking-[0.2em] text-white/10 sm:text-5xl">
            {BRAND_NAME}
          </span>
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-900 px-4 py-3">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Watch later inside {BRAND_NAME}. Local download requires admin approval.
        </p>
      </div>
    </div>
  );
}
