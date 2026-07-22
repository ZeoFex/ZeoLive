"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Shield, UserCheck, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { AdminStatCard } from "@/components/shared/admin-stat-card";
import { Button } from "@/components/ui/button";
import { checklistLabel } from "@/lib/constants/tutor-verification-checklist";
import { formatDate } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  activeTutors: number;
  pendingTutors: number;
  awaitingFinal: number;
  students: number;
  subAdmins: number;
}

interface AwaitingFinalItem {
  id: string;
  name: string;
  email: string;
  submittedAt: string;
  subadminReviews: {
    reviewerName: string;
    checkedItems: string[];
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [awaitingFinal, setAwaitingFinal] = useState<AwaitingFinalItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    fetch("/api/admin/verification?status=awaiting_final")
      .then((r) => r.json())
      .then((data) => setAwaitingFinal(data.items ?? []))
      .catch(() => {});
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Platform overview"
        description="Review tutor applications, manage users, and monitor platform activity."
        actions={
          <>
            <Button variant="outline" className="admin-outline-btn rounded-xl" asChild>
              <Link href="/admin/verification?status=pending">Manage verification</Link>
            </Button>
            <Button className="admin-gradient-btn rounded-xl" asChild>
              <Link href="/admin/users">
                <Plus className="mr-2 h-4 w-4" />
                Add user
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Total users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
        />
        <AdminStatCard
          title="Students"
          value={(stats?.students ?? 0).toLocaleString()}
          icon={Users}
        />
        <AdminStatCard
          title="Approved tutors"
          value={(stats?.activeTutors ?? 0).toLocaleString()}
          icon={UserCheck}
        />
        <AdminStatCard
          title="Sub-admins"
          value={(stats?.subAdmins ?? 0).toLocaleString()}
          icon={Shield}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="admin-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tutor verification</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sub-admins review with a checklist. You give final approval.
              </p>
            </div>
            <div className="admin-stat-icon flex h-10 w-10 items-center justify-center rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="admin-gradient-btn rounded-xl" asChild>
              <Link href="/admin/verification?status=awaiting_final">
                Final approval ({stats?.awaitingFinal ?? 0})
              </Link>
            </Button>
            <Button variant="outline" className="admin-outline-btn rounded-xl" asChild>
              <Link href="/admin/verification?status=pending">
                Sub-admin queue ({stats?.pendingTutors ?? 0})
              </Link>
            </Button>
          </div>

          {awaitingFinal.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-slate-800">Awaiting final approval</p>
              {awaitingFinal.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="admin-outline-btn rounded-lg" asChild>
                      <Link href="/admin/verification?status=awaiting_final">Review</Link>
                    </Button>
                  </div>
                  {item.subadminReviews.map((review) => (
                    <div key={`${item.id}-${review.reviewerName}-${review.createdAt}`} className="mt-2">
                      <p className="text-xs font-medium text-blue-700">
                        Recommended by {review.reviewerName} · {formatDate(review.createdAt)}
                      </p>
                      <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
                        {review.checkedItems.map((checkId) => (
                          <li key={checkId}>{checklistLabel(checkId)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card p-6">
          <h3 className="text-base font-bold text-slate-900">User management</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create sub-admin, tutor, or student accounts. Sub-admins can only review tutor
            applications.
          </p>
          <Button variant="outline" className="admin-outline-btn mt-5 rounded-xl" asChild>
            <Link href="/admin/users">Manage all users</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
