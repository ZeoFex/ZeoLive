"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function TutorEarningsPage() {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const sessions = data.sessions ?? [];
        setCompletedCount(
          sessions.filter((s: { status: string }) => s.status === "COMPLETED").length
        );
      })
      .catch(() => setCompletedCount(0));
  }, []);

  return (
    <>
      <TutorPageHeader
        title="Earnings"
        description="Payouts and transaction history will appear here when payments are enabled."
      />

      <div className="tutor-stat-card mb-6 max-w-sm">
        <p className="text-sm font-medium text-slate-500">Completed sessions</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
          {completedCount}
        </p>
        <p className="mt-1 text-xs text-slate-500">Revenue tracking coming soon</p>
      </div>

      <div className="tutor-card px-6 py-12 text-center">
        <h3 className="text-base font-bold text-slate-900">Payments not enabled yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Withdrawals and earnings charts are not connected. Focus on your upcoming
          sessions until billing is integrated.
        </p>
        <Button className="tutor-gradient-btn mt-6 rounded-xl" asChild>
          <Link href={routes.tutor.sessions}>View sessions</Link>
        </Button>
      </div>
    </>
  );
}
