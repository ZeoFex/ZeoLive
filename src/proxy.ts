import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-env";
import {
  adminDashboardPath,
  canAccessAdminPath,
} from "@/lib/admin-permissions";
import {
  dashboardForRole,
  loginPathForArea,
  loginUrlWithCallback,
  roleAllowedOnPath,
  routes,
  shouldRedirectSignupPath,
} from "@/lib/routes";

type AppRole = "STUDENT" | "TUTOR" | "ADMIN";
type AppAdminTier = "SUPERADMIN" | "SUBADMIN";

interface TokenWithRole {
  sub?: string;
  role?: AppRole;
  adminTier?: AppAdminTier;
}

const publicAuthPaths = [
  routes.login,
  routes.adminLogin,
  routes.signup,
  routes.forgotPassword,
  "/reset-password",
  "/verify-otp",
  routes.adminSetup,
];

function isPublicAuthPath(pathname: string) {
  return (
    publicAuthPaths.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    ) || pathname.startsWith("/api/auth")
  );
}

async function readAuthToken(req: NextRequest) {
  const secret = getAuthSecret();
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const preferSecure =
    forwardedProto === "https" || req.nextUrl.protocol === "https:";

  // Try the expected cookie first, then the alternate. Mismatched Secure cookie
  // prefixes are a common cause of "login succeeds then bounce back to login".
  const attempts = [preferSecure, !preferSecure];
  for (const secureCookie of attempts) {
    const token = (await getToken({
      req,
      secret,
      secureCookie,
    })) as TokenWithRole | null;
    if (token?.sub) return token;
  }

  // Explicit cookie names used by Auth.js v5 (chunked tokens included via store).
  for (const cookieName of [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ]) {
    const token = (await getToken({
      req,
      secret,
      cookieName,
    })) as TokenWithRole | null;
    if (token?.sub) return token;
  }

  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await readAuthToken(req);

  const isLoggedIn = !!token?.sub;
  const role = token?.role;
  const adminTier = token?.adminTier;

  if (isPublicAuthPath(pathname)) {
    if (isLoggedIn && role) {
      if (shouldRedirectSignupPath(pathname, role)) {
        return NextResponse.redirect(
          new URL(dashboardForRole(role), req.nextUrl)
        );
      }
      if (pathname === routes.adminLogin && role === "ADMIN") {
        return NextResponse.redirect(
          new URL(adminDashboardPath(adminTier), req.nextUrl)
        );
      }
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith(routes.student.root) ||
    pathname.startsWith(routes.tutor.root) ||
    pathname.startsWith(routes.admin.root) ||
    pathname.startsWith("/classroom");

  if (isProtected && !isLoggedIn) {
    const loginPath = loginPathForArea(pathname);
    const area = loginPath === routes.adminLogin ? "admin" : "default";
    return NextResponse.redirect(
      new URL(loginUrlWithCallback(pathname, area), req.nextUrl)
    );
  }

  if (isProtected && isLoggedIn && role && !roleAllowedOnPath(pathname, role)) {
    if (pathname.startsWith(routes.admin.root)) {
      return NextResponse.redirect(
        new URL(
          loginUrlWithCallback(pathname, "admin"),
          req.nextUrl
        )
      );
    }
    return NextResponse.redirect(
      new URL(dashboardForRole(role), req.nextUrl)
    );
  }

  if (
    isProtected &&
    isLoggedIn &&
    role === "ADMIN" &&
    pathname.startsWith(routes.admin.root) &&
    !canAccessAdminPath(pathname, adminTier ?? "SUBADMIN")
  ) {
    return NextResponse.redirect(
      new URL(routes.admin.verification, req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/tutor/:path*",
    "/admin",
    "/admin/:path*",
    "/classroom/:path*",
    "/login",
    "/admin/login",
    "/signup",
    "/signup/:path*",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
    "/recommendation/:path*",
    "/admin/setup",
    "/api/admin/bootstrap",
  ],
};
