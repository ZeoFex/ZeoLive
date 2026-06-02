"use client";

import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatComposer } from "@/components/messaging/chat-composer";
import { MessageThreadList } from "@/components/messaging/message-thread-list";
import {
  DeleteConfirmDialog,
  type DeleteConfirmTarget,
} from "@/components/messaging/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversationSummary, StoredMessageDto } from "@/lib/messaging";

type Contact = {
  userId: string;
  name: string;
  email: string;
};

interface MessagesInboxProps {
  role: "STUDENT" | "TUTOR";
  bookSessionHref: string;
  emptyHint: string;
  className?: string;
}

export function MessagesInbox({
  role,
  bookSessionHref,
  emptyHint,
  className,
}: MessagesInboxProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<StoredMessageDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmTarget | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/messages/conversations", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load conversations");
      setConversations(json.conversations ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load conversations");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/tutoring-sessions", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) return;

      const seen = new Map<string, Contact>();
      for (const s of json.sessions ?? []) {
        if (role === "STUDENT" && s.tutor?.id) {
          seen.set(s.tutor.id, {
            userId: s.tutor.id,
            name: s.tutor.name ?? "Tutor",
            email: "",
          });
        }
        if (role === "TUTOR" && s.student?.id) {
          seen.set(s.student.id, {
            userId: s.student.id,
            name: s.student.name ?? "Student",
            email: "",
          });
        }
      }
      setContacts([...seen.values()]);
    } catch {
      /* optional */
    }
  }, [role]);

  const loadThread = useCallback(async (conversationId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load messages");
      setMessages(json.messages ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load messages");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    void loadContacts();
  }, [loadConversations, loadContacts]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
    else setMessages([]);
  }, [selectedId, loadThread]);

  const selected = conversations.find((c) => c.id === selectedId);
  const peer = selected
    ? role === "STUDENT"
      ? selected.tutor
      : selected.student
    : null;

  const openDeleteDialog = (target: DeleteConfirmTarget) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "message") {
        if (!selectedId) return;
        setDeletingMessageId(deleteTarget.messageId);
        const res = await fetch(
          `/api/messages/conversations/${selectedId}/messages/${deleteTarget.messageId}`,
          { method: "DELETE", credentials: "same-origin" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not delete message");
        setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.messageId));
        await loadConversations();
        toast.success("Message deleted");
      } else {
        const res = await fetch(`/api/messages/conversations/${deleteTarget.conversationId}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not delete conversation");
        if (selectedId === deleteTarget.conversationId) {
          setSelectedId(null);
          setMessages([]);
        }
        await loadConversations();
        toast.success("Conversation deleted");
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
      setDeletingMessageId(null);
    }
  };

  const startWithContact = async (contact: Contact) => {
    const existing = conversations.find((c) =>
      role === "STUDENT" ? c.tutor.id === contact.userId : c.student.id === contact.userId
    );
    if (existing) {
      setSelectedId(existing.id);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(
          role === "STUDENT"
            ? { tutorId: contact.userId }
            : { studentId: contact.userId }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start conversation");
      await loadConversations();
      setSelectedId(json.conversationId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start conversation");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedId) return;

      setSending(true);
      try {
        const res = await fetch(`/api/messages/conversations/${selectedId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ body: text.trim() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not send");
        await loadThread(selectedId);
        await loadConversations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not send message");
      } finally {
        setSending(false);
      }
    },
    [selectedId, loadThread, loadConversations]
  );

  return (
    <div
      className={cn(
        "flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card md:min-h-[520px] md:flex-row",
        className
      )}
    >
      <DeleteConfirmDialog
        target={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open && !deleteLoading) setDeleteTarget(null);
        }}
        onConfirm={performDelete}
        loading={deleteLoading}
      />

      <aside className="flex w-full flex-col border-b md:w-72 md:border-b-0 md:border-r">
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Conversations</p>
          <p className="text-xs text-muted-foreground">Stored for safety and review</p>
        </div>
        <div className="max-h-40 overflow-y-auto border-b p-2 md:max-h-none md:flex-1">
          {loadingList ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => {
                const p = role === "STUDENT" ? c.tutor : c.student;
                return (
                  <li key={c.id} className="flex items-stretch gap-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selectedId === c.id && "bg-muted font-medium"
                      )}
                    >
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.email || c.lastMessage || "No messages"}
                      </p>
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-auto shrink-0 self-center text-muted-foreground hover:text-destructive"
                      title="Delete conversation"
                      onClick={() =>
                        openDeleteDialog({
                          type: "conversation",
                          conversationId: c.id,
                          studentName: c.student.name,
                          studentEmail: c.student.email,
                          tutorName: c.tutor.name,
                          tutorEmail: c.tutor.email,
                          messageCount: c.messageCount,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {contacts.length > 0 && (
          <div className="hidden border-t p-2 md:block">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase text-muted-foreground">
              From your sessions
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {contacts.map((c) => (
                <li key={c.userId}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => void startWithContact(c)}
                    disabled={sending}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <div className="flex min-h-[280px] flex-1 flex-col">
        {!selectedId || !selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-xs text-sm text-muted-foreground">{emptyHint}</p>
            {contacts.length === 0 && (
              <Button asChild size="sm">
                <Link href={bookSessionHref}>Book a session</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{peer?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{peer?.email}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() =>
                  openDeleteDialog({
                    type: "conversation",
                    conversationId: selected.id,
                    studentName: selected.student.name,
                    studentEmail: selected.student.email,
                    tutorName: selected.tutor.name,
                    tutorEmail: selected.tutor.email,
                    messageCount: selected.messageCount,
                  })
                }
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete chat
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <MessageThreadList
                  messages={messages}
                  currentUserId={currentUserId}
                  loading={loadingThread}
                  deletingMessageId={deletingMessageId}
                  onRequestDelete={(msg) =>
                    openDeleteDialog({
                      type: "message",
                      messageId: msg.id,
                      senderName: msg.senderName,
                      bodyPreview: msg.body,
                    })
                  }
                />
              </div>
              <ChatComposer
                onSend={sendMessage}
                disabled={sending}
                placeholder="Type a message…"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
