"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type ClassReport = {
  id: string;
  reporterName: string;
  targetName: string;
  reason: string;
  details: string;
  createdAt: string;
  sessionTitle: string;
  scheduledAt: string;
};

export default function AdminClassReportsPage() {
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/class-reports", { credentials: "same-origin" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not load class reports");
      setReports(json.reports ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load class reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminPageHeader
        title="Class reports"
        description="Reports sent from a live classroom."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-slate-500">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-slate-500">No class reports yet.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">
                {report.reporterName} reported {report.targetName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {report.reason} · {report.sessionTitle} · {formatDate(report.scheduledAt)}
              </p>
              {report.details ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.details}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">{formatDate(report.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
