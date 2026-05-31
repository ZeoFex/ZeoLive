import type { Role } from "@/generated/prisma";

/** App route constants — single source of truth for navigation & redirects */
export const routes = {
  home: "/",
  login: "/login",
  adminLogin: "/admin/login",
  adminSetup: "/admin/setup",
  forgotPassword: "/forgot-password",
  signup: "/signup",
  signupStudent: "/signup/student",
  signupTutor: "/signup/tutor",
  student: {
    dashboard: "/student/dashboard",
    classes: "/student/classes",
    book: "/student/book",
    tutors: "/student/tutors",
    payments: "/student/payments",
    messages: "/student/messages",
    settings: "/student/settings",
    root: "/student",
  },
  tutor: {
    dashboard: "/tutor/dashboard",
    students: "/tutor/students",
    sessions: "/tutor/sessions",
    earnings: "/tutor/earnings",
    availability: "/tutor/availability",
    materials: "/tutor/materials",
    settings: "/tutor/settings",
    onboarding: "/tutor/onboarding",
    root: "/tutor",
  },
  admin: {
    dashboard: "/admin/dashboard",
    verification: "/admin/verification",
    root: "/admin",
  },
} as const;

export function dashboardForRole(role: Role) {
  switch (role) {
    case "ADMIN":
      return routes.admin.dashboard;
    case "TUTOR":
      return routes.tutor.dashboard;
    case "STUDENT":
    default:
      return routes.student.dashboard;
  }
}

/** Login page for a protected area (admin uses dedicated URL). */
export function loginPathForArea(pathname: string) {
  if (pathname.startsWith(routes.admin.root)) {
    return routes.adminLogin;
  }
  return routes.login;
}

/** Build login URL with optional return path after sign-in. */
export function loginUrlWithCallback(callbackPath: string, area: "default" | "admin" = "default") {
  const base = area === "admin" ? routes.adminLogin : routes.login;
  const url = new URL(base, "http://local");
  url.searchParams.set("callbackUrl", callbackPath);
  return `${url.pathname}${url.search}`;
}

/** Only allow same-origin relative callbacks that match the user's role. */
export function safeCallbackForRole(
  callbackUrl: string | null | undefined,
  role: Role
): string | null {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return null;
  }

  if (callbackUrl.startsWith(routes.admin.root) && role !== "ADMIN") {
    return null;
  }
  if (
    callbackUrl.startsWith(routes.tutor.root) &&
    role !== "TUTOR" &&
    role !== "ADMIN"
  ) {
    return null;
  }
  if (
    callbackUrl.startsWith(routes.student.root) &&
    role !== "STUDENT" &&
    role !== "ADMIN"
  ) {
    return null;
  }

  return callbackUrl;
}

/** Only skip signup when the user already has that role (e.g. student → /signup/student). */
export function shouldRedirectSignupPath(pathname: string, role: Role) {
  if (pathname.startsWith(routes.signupStudent) && role === "STUDENT") {
    return true;
  }
  if (pathname.startsWith(routes.signupTutor) && role === "TUTOR") {
    return true;
  }
  return false;
}

export function roleAllowedOnPath(pathname: string, role: Role) {
  if (pathname.startsWith(routes.admin.root)) return role === "ADMIN";
  if (pathname.startsWith(routes.tutor.root)) return role === "TUTOR" || role === "ADMIN";
  if (pathname.startsWith(routes.student.root)) {
    return role === "STUDENT" || role === "ADMIN";
  }
  if (pathname.startsWith("/classroom")) {
    return role === "STUDENT" || role === "TUTOR" || role === "ADMIN";
  }
  return true;
}
