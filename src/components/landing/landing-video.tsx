"use client";

import { useEffect, useRef } from "react";
import { resolveCmsVideoPlayback } from "@/lib/cms-video";

type LandingVideoProps = {
  videoUrl: string;
  title: string;
  posterSrc?: string;
  className?: string;
};

export function LandingVideo({
  videoUrl,
  title,
  posterSrc,
  className,
}: LandingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playback = resolveCmsVideoPlayback(videoUrl);

  useEffect(() => {
    const current = resolveCmsVideoPlayback(videoUrl);
    if (!current || current.kind !== "file") return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const attempt = el.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        /* Browser may still block autoplay; controls remain available. */
      });
    }
  }, [videoUrl]);

  if (!playback) return null;

  return (
    <div className={className}>
      {title ? (
        <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      ) : null}
      <div className="overflow-hidden rounded-lg border bg-black shadow-sm">
        {playback.kind === "embed" ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={playback.src}
              title={title || "Platform video"}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={posterSrc || undefined}
            src={playback.src}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}
