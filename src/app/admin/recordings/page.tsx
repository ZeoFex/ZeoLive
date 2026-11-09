"use client";

import { Check, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { RecordingsLibrary } from "@/components/recordings/recordings-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface DownloadRequestRow {
  id: string;
  status: string;
  accessCode: string | null;
  requesterEmail: string;
  requesterName: string;
  requesterRole: string;
  createdAt: string;
  reviewedAt: string | null;
  recording: {
    id: string;
    title: string;
    fileName: string;
    subject: string | null;
  };
}

export default function AdminRecordingsPage() {
  const [status, setStatus] = useState("PENDING");
  const [requests, setRequests] = useState<DownloadRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/recording-downloads?status=${encodeURIComponent(status)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load requests");
      setRequests(json.requests ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load requests");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/recording-downloads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not update request");
      toast.success(
        action === "approve"
          ? json.message ?? "Download approved"
          : "Download request rejected"
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update request");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Recordings"
        description="Watch all lesson recordings, upload if needed, and approve local download requests tied to a user’s email."
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Download requests
          </h2>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DOWNLOADED">Downloaded</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : requests.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No download requests in this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {item.requesterName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.requesterEmail} · {item.requesterRole.toLowerCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {item.recording.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.recording.subject || item.recording.fileName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                        {item.accessCode ?? "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.status.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={busyId === item.id}
                            onClick={() => void review(item.id, "approve")}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === item.id}
                            onClick={() => void review(item.id, "reject")}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Reviewed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          All recordings
        </h2>
        <RecordingsLibrary mode="admin" allowUpload />
      </section>
    </div>
  );
}
