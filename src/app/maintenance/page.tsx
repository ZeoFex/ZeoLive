import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function MaintenancePage() {
  const settings = await getPlatformSettings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
        {BRAND_NAME}
      </p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
        Under maintenance
      </h1>
      <p className="mt-4 max-w-md text-sm text-slate-600">
        {settings.maintenanceMessage}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/admin/login"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Admin sign in
        </Link>
        {settings.supportEmail ? (
          <a
            href={`mailto:${settings.supportEmail}`}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Contact support
          </a>
        ) : null}
      </div>
    </div>
  );
}
