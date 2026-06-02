"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BYPASS_PREFIXES = [
  "/admin",
  "/maintenance",
  "/api",
  "/_next",
];

function shouldBypass(pathname: string) {
  return BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (shouldBypass(pathname)) {
      setBlocked(false);
      return;
    }

    if (session?.user?.role === "ADMIN") {
      setBlocked(false);
      return;
    }

    let cancelled = false;

    fetch("/api/platform/status")
      .then((r) => r.json())
      .then((data: { maintenanceMode?: boolean }) => {
        if (cancelled) return;
        if (data.maintenanceMode) {
          setBlocked(true);
          if (pathname !== "/maintenance") {
            router.replace("/maintenance");
          }
        } else {
          setBlocked(false);
        }
      })
      .catch(() => {
        if (!cancelled) setBlocked(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, session?.user?.role]);

  if (blocked && pathname !== "/maintenance") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
