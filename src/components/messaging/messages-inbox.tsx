"use client";

import { Loader2, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send");
      setDraft("");
      await loadThread(selectedId);
      await loadConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card md:min-h-[520px] md:flex-row",
        className
      )}
    >
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
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selectedId === c.id && "bg-muted font-medium"
                      )}
                    >
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.lastMessage ?? "No messages"}
                      </p>
                    </button>
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
        {!selectedId ? (
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
            <div className="border-b px-4 py-3">
              <p className="font-semibold">{peer?.name}</p>
              <p className="text-xs text-muted-foreground">{peer?.email}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingThread ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {msg.senderName}
                      {msg.channel === "CLASSROOM" && " · classroom"}
                    </p>
                    <p className="mt-0.5 text-sm">{msg.body}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
