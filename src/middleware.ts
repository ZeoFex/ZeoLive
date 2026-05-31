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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = (await getToken({
    req,
    secret: getAuthSecret(),
  })) as TokenWithRole | null;

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
