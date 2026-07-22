/** Resolve CMS video URLs to either a file player or an embeddable iframe src. */

export type CmsVideoPlayback =
  | { kind: "file"; src: string }
  | { kind: "embed"; src: string }
  | null;

function withAutoplayParams(embedUrl: string, provider: "youtube" | "vimeo") {
  const url = new URL(embedUrl);
  if (provider === "youtube") {
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");
  } else {
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("muted", "1");
    url.searchParams.set("playsinline", "1");
  }
  return url.toString();
}

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${url.pathname}${url.search}`;
      }
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    if (host === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
      return `https://player.vimeo.com${url.pathname}`;
    }

    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

export function resolveCmsVideoPlayback(videoUrl: string): CmsVideoPlayback {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  const youtube = youtubeEmbedUrl(trimmed);
  if (youtube) {
    return { kind: "embed", src: withAutoplayParams(youtube, "youtube") };
  }

  const vimeo = vimeoEmbedUrl(trimmed);
  if (vimeo) {
    return { kind: "embed", src: withAutoplayParams(vimeo, "vimeo") };
  }

  return { kind: "file", src: trimmed };
}
