"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import type { AdminAnalytics } from "@/lib/analytics";

const PIE_COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#64748b", "#ef4444"];

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "same-origin" });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as AdminAnalytics & { error?: string }) : null;
      if (!res.ok || !json) throw new Error(json?.error ?? "Could not load analytics");
      setData(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exportSnapshot = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeolive-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminPageHeader
        title="Analytics & reports"
        description="Live platform metrics from your database — users, sessions, and messages."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              className="admin-gradient-btn"
              onClick={exportSnapshot}
              disabled={!data}
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total users", value: data.overview.totalUsers },
              { label: "Students", value: data.overview.students },
              { label: "Approved tutors", value: data.overview.approvedTutors },
              { label: "Tutoring sessions", value: data.overview.totalSessions },
              { label: "Active now", value: data.overview.activeSessions },
              { label: "Completed", value: data.overview.completedSessions },
              { label: "Stored messages", value: data.overview.totalMessages },
              { label: "Conversations", value: data.overview.conversations },
            ].map((card) => (
              <div key={card.label} className="admin-stat-card">
                <p className="text-2xl font-bold tabular-nums text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-500">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="admin-card p-5">
              <h3 className="text-sm font-semibold text-slate-900">Sessions (last 6 months)</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sessionsLast6Months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-card p-5">
              <h3 className="text-sm font-semibold text-slate-900">Sessions by status</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.sessionsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(props) => {
                        const row = props.payload as { status: string; count: number };
                        return `${row.status}: ${row.count}`;
                      }}
                    >
                      {data.sessionsByStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="admin-card p-5">
              <h3 className="text-sm font-semibold text-slate-900">Users by role</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.usersByRole}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-card p-5">
              <h3 className="text-sm font-semibold text-slate-900">Top tutors by sessions</h3>
              <ul className="mt-4 space-y-3">
                {data.topTutors.length === 0 ? (
                  <li className="text-sm text-slate-500">No session data yet.</li>
                ) : (
                  data.topTutors.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">
                          ★ {t.rating.toFixed(1)} · {t.reviewCount} reviews
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-violet-600">
                        {t.sessions} sessions
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
