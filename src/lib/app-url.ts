export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function loginUrl() {
  return `${getAppBaseUrl()}/login`;
}

export function resetPasswordUrl(rawToken: string) {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function recommendationSubmitUrl(token: string) {
  return `${getAppBaseUrl()}/recommendation/${token}`;
}

export function adminVerificationUrl(status?: string) {
  const base = `${getAppBaseUrl()}/admin/verification`;
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}
