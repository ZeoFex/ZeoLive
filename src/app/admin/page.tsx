import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** `/admin` has no page — send visitors to the admin dashboard (auth gate handles login). */
export default function AdminIndexPage() {
  redirect(routes.admin.dashboard);
}
