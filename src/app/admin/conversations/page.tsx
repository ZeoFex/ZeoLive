"use client";

import { Download, Loader2, Play, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { TranscriptMessageList } from "@/components/messaging/transcript-playback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConversationSummary, StoredMessageDto } from "@/lib/messaging";
import { cn } from "@/lib/utils";

export default function AdminConversationsPage() {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<StoredMessageDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/conversations?${params}`, {
        credentials: "same-origin",
      });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as { conversations?: ConversationSummary[]; error?: string }) : {};
      if (!res.ok) throw new Error(json.error ?? "Could not load conversations");
      setConversations(json.conversations ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load conversations");
    } finally {
      setLoadingList(false);
    }
  }, [search]);

  const loadDetail = useCallback(async (conversationId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        credentials: "same-origin",
      });
      const text = await res.text();
      const json = text
        ? (JSON.parse(text) as {
            conversation?: ConversationSummary;
            messages?: StoredMessageDto[];
            error?: string;
          })
        : {};
      if (!res.ok) throw new Error(json.error ?? "Could not load transcript");
      setDetail(json.conversation ?? null);
      setMessages(json.messages ?? []);
      setPlaybackIndex(null);
      setPlaying(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load transcript");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setMessages([]);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!playing || messages.length === 0) return;
    const timer = window.setInterval(() => {
      setPlaybackIndex((i) => {
        const next = i === null ? 0 : i + 1;
        if (next >= messages.length - 1) {
          setPlaying(false);
          return messages.length - 1;
        }
        return next;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [playing, messages.length]);

  const download = (format: "txt" | "json") => {
    if (!selectedId) return;
    window.open(
      `/api/admin/conversations/${selectedId}/export?format=${format}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Conversation records"
        description="Review and export student–tutor messages (direct and classroom) for safety and evidence."
      />

      <div className="admin-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by student or tutor name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadList()}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadList()}>
          Search
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="admin-card overflow-hidden lg:col-span-2">
          {loadingList ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead className="text-right">Msgs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                      No conversations stored yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.map((c) => (
                    <TableRow
                      key={c.id}
                      className={cn(
                        "cursor-pointer",
                        selectedId === c.id && "bg-slate-50"
                      )}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <TableCell>
                        <p className="font-medium">{c.student.name}</p>
                        <p className="text-xs text-slate-500">{c.student.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{c.tutor.name}</p>
                        <p className="text-xs text-slate-500">{c.tutor.email}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {c.lastMessageAt
                          ? new Date(c.lastMessageAt).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.messageCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="admin-card flex min-h-[480px] flex-col lg:col-span-3">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
              <p>Select a conversation to view the full transcript.</p>
              <p className="text-xs">
                Download as text or JSON for investigations and records.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : detail ? (
            <>
              <div className="border-b p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {detail.student.name} ↔ {detail.tutor.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {detail.messageCount} messages · ID {detail.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (playing) {
                          setPlaying(false);
                        } else {
                          setPlaybackIndex(0);
                          setPlaying(true);
                        }
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {playing ? "Pause" : "Play"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => download("txt")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      .txt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => download("json")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      .json
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">Student: {detail.student.email}</Badge>
                  <Badge variant="secondary">Tutor: {detail.tutor.email}</Badge>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <TranscriptMessageList
                  messages={messages}
                  highlightIndex={playbackIndex}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
