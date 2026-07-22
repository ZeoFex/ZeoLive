import Image from "next/image";
import { cn } from "@/lib/utils";

interface LandingImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}

function isLocalSrc(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

export function LandingImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: LandingImageProps) {
  const local = isLocalSrc(src);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        // CMS may point at hosts outside next.config remotePatterns.
        unoptimized={!local}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
