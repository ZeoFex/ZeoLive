"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, UserCheck, Users } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DashboardHeader
        title="Super Admin Overview"
        subtitle="Manage users, sub-admins, and tutor verification"
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            icon={Users}
          />
          <StatCard
            title="Students"
            value={(stats?.students ?? 0).toLocaleString()}
            icon={Users}
          />
          <StatCard
            title="Approved Tutors"
            value={(stats?.activeTutors ?? 0).toLocaleString()}
            icon={UserCheck}
          />
          <StatCard
            title="Sub-admins"
            value={(stats?.subAdmins ?? 0).toLocaleString()}
            icon={Shield}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                Tutor verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sub-admins review applications with a checklist. You give final approval
                after reviewing their recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/admin/verification?status=awaiting_final">
                    Final approval ({stats?.awaitingFinal ?? 0})
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/verification?status=pending">
                    Sub-admin queue ({stats?.pendingTutors ?? 0})
                  </Link>
                </Button>
              </div>

              {awaitingFinal.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Awaiting your final approval</p>
                  {awaitingFinal.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/admin/verification?status=awaiting_final">
                            Review
                          </Link>
                        </Button>
                      </div>
                      {item.subadminReviews.map((review) => (
                        <div key={`${item.id}-${review.reviewerName}-${review.createdAt}`}>
                          <p className="text-xs font-medium">
                            Recommended by {review.reviewerName} ·{" "}
                            {formatDate(review.createdAt)}
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">User management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create sub-admin, tutor, or student accounts. Sub-admins can only review
                tutor applications. Sign in at /admin/login.
              </p>
              <Button variant="outline" asChild>
                <Link href="/admin/users">Manage users</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
