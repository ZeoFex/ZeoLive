/** Turn a LiveKit env value into a websocket URL the browser can pass to `new URL`. */
export function liveKitWebsocketUrl(raw: string | undefined | null): string | null {
  if (typeof raw !== "string") return null;

  let value = raw.trim().replace(/^['"]+|['"]+$/g, "").trim();
  value = value.replace(/\s+/g, "");
  if (!value || value === "undefined" || value === "null" || value.startsWith("eyJ")) return null;

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = `wss://${value}`;
  } else if (value.startsWith("https://")) {
    value = `wss://${value.slice("https://".length)}`;
  } else if (value.startsWith("http://")) {
    value = `ws://${value.slice("http://".length)}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "wss:" && url.protocol !== "ws:") return null;
    if (!url.hostname) return null;
    if (url.hostname !== "localhost" && !url.hostname.includes(".")) return null;
    url.hash = "";
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
