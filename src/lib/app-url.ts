const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalhostAppUrl(url: string): boolean {
  try {
    return LOCALHOST_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/** Hosting-provided URL when AUTH_URL was not set for production. */
export function inferDeploymentBaseUrl(): string | undefined {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && !isLocalhostAppUrl(appUrl)) {
    return normalizeBaseUrl(appUrl);
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return normalizeBaseUrl(`https://${vercelProduction}`);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return normalizeBaseUrl(`https://${vercel}`);
  }

  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) {
    return normalizeBaseUrl(render);
  }

  return undefined;
}

function pickConfiguredBaseUrl(): string | undefined {
  const candidates = [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const raw of candidates) {
    const url = normalizeBaseUrl(raw);
    if (process.env.NODE_ENV === "production" && isLocalhostAppUrl(url)) {
      continue;
    }
    return url;
  }

  return undefined;
}

/** Canonical app origin for emails and Auth.js (never localhost in production when avoidable). */
export function getAppBaseUrl(override?: string): string {
  if (override) {
    return normalizeBaseUrl(override);
  }

  return (
    pickConfiguredBaseUrl() ??
    inferDeploymentBaseUrl() ??
    "http://localhost:3000"
  );
}

export function getBaseUrlFromHeaders(headers: Headers): string | undefined {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return undefined;

  const hostname = host.split(":")[0] ?? host;
  if (LOCALHOST_HOSTS.has(hostname)) {
    return undefined;
  }

  const proto =
    headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return normalizeBaseUrl(`${proto}://${host}`);
}

export function getAppBaseUrlFromRequest(
  request: Request | { headers: Headers }
): string {
  const fromHeaders = getBaseUrlFromHeaders(request.headers);
  if (fromHeaders) return fromHeaders;
  return getAppBaseUrl();
}

/**
 * Auth.js uses AUTH_URL for sign-in/sign-out redirects. In production, ignore
 * localhost values from local .env files and prefer hosting env or request host.
 */
export function syncAuthUrlForDeployment(): void {
  if (process.env.NODE_ENV !== "production") return;

  const resolved = pickConfiguredBaseUrl() ?? inferDeploymentBaseUrl();
  if (!resolved) return;

  process.env.AUTH_URL = resolved;
  process.env.NEXTAUTH_URL = resolved;
}

export function loginUrl(baseUrl?: string) {
  return `${getAppBaseUrl(baseUrl)}/login`;
}

export function resetPasswordUrl(rawToken: string, baseUrl?: string) {
  return `${getAppBaseUrl(baseUrl)}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function recommendationSubmitUrl(token: string, baseUrl?: string) {
  return `${getAppBaseUrl(baseUrl)}/recommendation/${token}`;
}

export function adminVerificationUrl(status?: string, baseUrl?: string) {
  const base = `${getAppBaseUrl(baseUrl)}/admin/verification`;
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}
