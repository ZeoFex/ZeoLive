export type NavIconName =
  | "layout-dashboard"
  | "book-open"
  | "calendar"
  | "users"
  | "credit-card"
  | "message-square"
  | "settings"
  | "wallet"
  | "file-text"
  | "shield"
  | "bar-chart"
  | "clipboard-list";

export interface NavItemConfig {
  href: string;
  label: string;
  icon: NavIconName;
}

export const studentNav: NavItemConfig[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/student/classes", label: "My Classes", icon: "book-open" },
  { href: "/student/book", label: "Book Session", icon: "calendar" },
  { href: "/student/tutors", label: "Tutors", icon: "users" },
  { href: "/student/payments", label: "Payments", icon: "credit-card" },
  { href: "/student/messages", label: "Messages", icon: "message-square" },
  { href: "/student/materials", label: "Materials", icon: "file-text" },
  { href: "/student/settings", label: "Settings", icon: "settings" },
];

export const tutorNav: NavItemConfig[] = [
  { href: "/tutor/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/tutor/students", label: "Students", icon: "users" },
  { href: "/tutor/messages", label: "Messages", icon: "message-square" },
  { href: "/tutor/sessions", label: "Sessions", icon: "book-open" },
  { href: "/tutor/earnings", label: "Earnings", icon: "wallet" },
  { href: "/tutor/availability", label: "Availability", icon: "calendar" },
  { href: "/tutor/materials", label: "Materials", icon: "file-text" },
  { href: "/tutor/settings", label: "Settings", icon: "settings" },
];

export const adminNav: NavItemConfig[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/conversations", label: "Conversations", icon: "message-square" },
  { href: "/admin/verification", label: "Verification", icon: "shield" },
  { href: "/admin/payments", label: "Payments", icon: "credit-card" },
  { href: "/admin/reports", label: "Analytics", icon: "bar-chart" },
  { href: "/admin/cms", label: "CMS", icon: "clipboard-list" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

/** Sub-admins: tutor review only */
export const subAdminNav: NavItemConfig[] = [
  { href: "/admin/conversations", label: "Conversations", icon: "message-square" },
  { href: "/admin/verification", label: "Verification", icon: "shield" },
];

export function navForAdminTier(tier: "SUPERADMIN" | "SUBADMIN" | null | undefined) {
  return tier === "SUBADMIN" ? subAdminNav : adminNav;
}
